import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { User as UserIcon, Camera, Trash2, Upload, Check, Minus, Plus } from "lucide-react";

const CROP_SIZE = 280; // área de ajuste (quadrado)
const OUTPUT_SIZE = 512; // tamanho final do avatar
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.12;

function revokeIfBlob(url?: string | null) {
  if (url && typeof url === "string" && url.startsWith("blob:")) URL.revokeObjectURL(url);
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

async function cropToSquare({
  src,
  offsetX,
  offsetY,
  zoom,
}: {
  src: string;
  offsetX: number;
  offsetY: number;
  zoom: number;
}): Promise<Blob> {
  const img = await loadImage(src);

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  const baseScale = Math.max(CROP_SIZE / iw, CROP_SIZE / ih);
  const s = baseScale * zoom;

  const dw = iw * s;
  const dh = ih * s;

  const canvas = document.createElement("canvas");
  canvas.width = CROP_SIZE;
  canvas.height = CROP_SIZE;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D context not available");

  ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--canvas-fill") || "#fff";
  ctx.fillRect(0, 0, CROP_SIZE, CROP_SIZE);

  const dx = CROP_SIZE / 2 + offsetX - dw / 2;
  const dy = CROP_SIZE / 2 + offsetY - dh / 2;

  ctx.drawImage(img, dx, dy, dw, dh);

  const outCanvas = document.createElement("canvas");
  outCanvas.width = OUTPUT_SIZE;
  outCanvas.height = OUTPUT_SIZE;
  const outCtx = outCanvas.getContext("2d");
  if (!outCtx) throw new Error("Canvas 2D context not available");
  outCtx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue("--canvas-fill") || "#fff";
  outCtx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  outCtx.drawImage(canvas, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  return await new Promise<Blob>((resolve, reject) => {
    outCanvas.toBlob((b) => {
      if (b) resolve(b);
      else reject(new Error("Failed to create blob"));
    }, "image/jpeg", 0.92);
  });
}

interface AccountPersonalFormProps {
  fullName: string;
  setFullName: (v: string) => void;
  username: string;
  setUsername: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  cpf: string;
  setCpf: (v: string) => void;
  phoneNumber: string;
  setPhoneNumber: (v: string) => void;
  avatarPreview?: string | null;
  avatarUrl?: string | null;
  setAvatarFile: (f: File | null) => void;
  setAvatarPreview: (s: string) => void;
  savePersonal: () => void;
  loading?: boolean;
}

export default function AccountPersonalForm({
  fullName,
  setFullName,
  username,
  setUsername,
  email,
  setEmail: _setEmail,
  cpf,
  setCpf,
  phoneNumber,
  setPhoneNumber,
  avatarPreview,
  avatarUrl,
  setAvatarFile,
  setAvatarPreview,
  savePersonal,
  loading = false,
}: AccountPersonalFormProps): JSX.Element {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [open, setOpen] = useState(false);

  const [draftSrc, setDraftSrc] = useState<string>("");
  const [zoom, setZoom] = useState<number>(1);
  const [offset, setOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  type DragState = { dragging: boolean; startX: number; startY: number; baseX: number; baseY: number };
  const dragRef = useRef<DragState>({ dragging: false, startX: 0, startY: 0, baseX: 0, baseY: 0 });

  const currentShownAvatar = avatarPreview || avatarUrl || "";
  const hasImage = Boolean(draftSrc);

  useEffect(() => {
    if (!open) return;
    setDraftSrc(currentShownAvatar || "");
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const openPicker = () => fileInputRef.current?.click();

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith("image/")) return;

    const max = 2 * 1024 * 1024;
    if (file.size > max) return;

    revokeIfBlob(draftSrc);
    const url = URL.createObjectURL(file);
    setDraftSrc(url);

    // permite selecionar o mesmo arquivo de novo
    e.currentTarget.value = "";
  };

  const getOffsetLimits = useCallback(async (z = zoom) => {
    if (!draftSrc) return { minX: 0, maxX: 0, minY: 0, maxY: 0 };

    const img = await loadImage(draftSrc);
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const baseScale = Math.max(CROP_SIZE / iw, CROP_SIZE / ih);
    const s = baseScale * z;

    const dw = iw * s;
    const dh = ih * s;

    const extraX = Math.max(0, (dw - CROP_SIZE) / 2);
    const extraY = Math.max(0, (dh - CROP_SIZE) / 2);

    return { minX: -extraX, maxX: extraX, minY: -extraY, maxY: extraY };
  }, [draftSrc, zoom]);

  const clampOffset = useCallback(async (x: number, y: number, z = zoom) => {
    const lim = await getOffsetLimits(z);
    return {
      x: clamp(x, lim.minX, lim.maxX),
      y: clamp(y, lim.minY, lim.maxY),
    };
  }, [getOffsetLimits, zoom]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!hasImage) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);

    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.baseX = offset.x;
    dragRef.current.baseY = offset.y;
  };

  const onPointerMove = async (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;

    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;

    const nextX = dragRef.current.baseX + dx;
    const nextY = dragRef.current.baseY + dy;

    const clamped = await clampOffset(nextX, nextY, zoom);
    setOffset(clamped);
  };

  const onPointerUp = () => {
    dragRef.current.dragging = false;
  };

  const setZoomSafe = async (nextZoom: number) => {
    const z = clamp(nextZoom, ZOOM_MIN, ZOOM_MAX);
    setZoom(z);

    const clamped = await clampOffset(offset.x, offset.y, z);
    setOffset(clamped);
  };

  const onRemove = () => {
    revokeIfBlob(draftSrc);
    setDraftSrc("");
    setZoom(1);
    setOffset({ x: 0, y: 0 });

    setAvatarFile(null);
    revokeIfBlob(avatarPreview || null);
    setAvatarPreview("");
  };

  const onApply = async () => {
    if (!draftSrc) return;

    const blob = await cropToSquare({ src: draftSrc, offsetX: offset.x, offsetY: offset.y, zoom });

    const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

    setAvatarFile(file);
    revokeIfBlob(avatarPreview || null);

    const url = URL.createObjectURL(blob);
    setAvatarPreview(url);

    setOpen(false);
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle>Dados Pessoais</CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-col items-center">
          <label className="text-sm text-slate-700 mb-2">Foto de perfil</label>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative group"
            aria-label="Editar foto de perfil"
            title="Editar foto"
          >
            <div className="h-32 w-32 rounded-xl border bg-slate-100 overflow-hidden shadow-sm">
              {currentShownAvatar ? (
                <img src={currentShownAvatar} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400">
                  <UserIcon className="w-9 h-9" />
                </div>
              )}
            </div>

            <div className="absolute -bottom-3 -right-3 rounded-full border bg-white shadow-sm p-2 transition group-hover:scale-105">
              <Camera className="w-4 h-4 text-slate-700" />
            </div>
          </button>
        </div>

        <Separator />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-700">Nome completo</label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-sm text-slate-700">Nome de usuário</label>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} className="mt-1" />
          </div>
        </div>

        <div>
          <label className="text-sm text-slate-700">E-mail</label>
          <Input
            value={email}
            readOnly
            className="mt-1 bg-slate-50 cursor-not-allowed text-slate-600"
            title="E-mail é somente leitura"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-slate-700">CPF</label>
            <Input value={cpf} onChange={(e) => setCpf(e.target.value)} className="mt-1" inputMode="numeric" placeholder="000.000.000-00" />
          </div>
          <div>
            <label className="text-sm text-slate-700">Telefone</label>
            <Input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="mt-1" inputMode="numeric" placeholder="(11) 99999-9999" />
          </div>
        </div>

        <div className="flex justify-end">
          <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={loading} onClick={savePersonal}>
            Salvar
          </Button>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[520px] focus:outline-none focus-visible:outline-none focus:ring-0 ring-0">
            <DialogHeader>
              <DialogTitle>Editar foto</DialogTitle>
              <p className="text-xs text-slate-500 mt-1">(PNG/JPG até 2MB).</p>
            </DialogHeader>

            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onSelectFile} aria-label="Selecionar imagem" title="Selecionar imagem" />

            <div className="space-y-4">
              <div className="flex flex-col items-center">
                {!draftSrc ? (
                  <button
                    type="button"
                    className="relative overflow-hidden rounded-2xl border bg-slate-100"
                    style={{ width: CROP_SIZE, height: CROP_SIZE }}
                    onClick={openPicker}
                    aria-label="Selecionar imagem"
                  >
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 gap-2">
                      <UserIcon className="w-8 h-8" />
                      <p className="text-sm">Selecione uma imagem</p>
                      <p className="text-xs text-slate-400">Use o botão abaixo (ou clique aqui).</p>
                    </div>
                  </button>
                ) : (
                  <div
                    className="relative overflow-hidden rounded-2xl border bg-slate-100"
                    style={{ width: CROP_SIZE, height: CROP_SIZE }}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                  >
                    <img
                      src={draftSrc}
                      alt="Prévia"
                      draggable={false}
                      className="absolute left-1/2 top-1/2 select-none"
                      style={{
                        transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                        transformOrigin: "center",
                        willChange: "transform",
                      }}
                    />

                    <div className="pointer-events-none absolute inset-0">
                      <div className="absolute top-0 bottom-0 left-1/3 w-px bg-slate-900/20" />
                      <div className="absolute top-0 bottom-0 left-2/3 w-px bg-slate-900/20" />
                      <div className="absolute left-0 right-0 top-1/3 h-px bg-slate-900/20" />
                      <div className="absolute left-0 right-0 top-2/3 h-px bg-slate-900/20" />
                      <div className="absolute inset-0 ring-1 ring-slate-900/10" />
                    </div>
                  </div>
                )}

                <p className="mt-2 text-xs text-slate-500">Dica: arraste para posicionar.</p>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm text-slate-700">Zoom</p>
                    <p className="text-xs text-slate-500">{Math.round(zoom * 100)}%</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button type="button" size="icon" variant="outline" className="rounded-full" onClick={() => setZoomSafe(zoom - ZOOM_STEP)} disabled={!draftSrc || zoom <= ZOOM_MIN + 1e-6} aria-label="Diminuir zoom" title="Diminuir zoom">
                      <Minus className="w-4 h-4" />
                    </Button>

                    <Button type="button" size="icon" variant="outline" className="rounded-full" onClick={() => setZoomSafe(zoom + ZOOM_STEP)} disabled={!draftSrc || zoom >= ZOOM_MAX - 1e-6} aria-label="Aumentar zoom" title="Aumentar zoom">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" className="gap-2" onClick={openPicker} aria-label="Selecionar imagem" title="Selecionar imagem">
                    <Upload className="w-4 h-4" />
                    <span>Selecionar foto</span>
                  </Button>

                  <Button type="button" size="sm" variant="destructive" className="gap-2" onClick={onRemove} disabled={!draftSrc} aria-label="Remover foto" title="Remover foto">
                    <Trash2 className="w-4 h-4" />
                    <span>Remover</span>
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="button" className="bg-emerald-600 hover:bg-emerald-700" onClick={onApply} disabled={!draftSrc}>
                  <Check className="w-4 h-4 mr-2" />
                  Aplicar
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
