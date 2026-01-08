import React from "react";
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

const CROP_SIZE = 280;     // área de ajuste (quadrado)
const OUTPUT_SIZE = 512;   // tamanho final do avatar
const ZOOM_MIN = 1;
const ZOOM_MAX = 3;
const ZOOM_STEP = 0.12;

function revokeIfBlob(url) {
  if (url && typeof url === "string" && url.startsWith("blob:")) URL.revokeObjectURL(url);
}

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

async function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Corta a imagem em um quadrado "cover" com offset + zoom,
 * gerando um blob (image/jpeg).
 */
async function cropToSquare({ src, offsetX, offsetY, zoom }) {
  const img = await loadImage(src);

  const iw = img.naturalWidth;
  const ih = img.naturalHeight;

  const baseScale = Math.max(CROP_SIZE / iw, CROP_SIZE / ih);
  const s = baseScale * zoom;

  const dw = iw * s;
  const dh = ih * s;

  const x0 = (CROP_SIZE - dw) / 2 + offsetX;
  const y0 = (CROP_SIZE - dh) / 2 + offsetY;

  let sx = (0 - x0) / s;
  let sy = (0 - y0) / s;
  let sw = CROP_SIZE / s;
  let sh = CROP_SIZE / s;

  sx = clamp(sx, 0, iw);
  sy = clamp(sy, 0, ih);
  sw = clamp(sw, 1, iw - sx);
  sh = clamp(sh, 1, ih - sy);

  const canvas = document.createElement("canvas");
  canvas.width = OUTPUT_SIZE;
  canvas.height = OUTPUT_SIZE;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas ctx not available");

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

  const blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
  );

  if (!blob) throw new Error("Failed to create blob");
  return blob;
}

export default function AccountPersonalForm({
  fullName,
  setFullName,
  username,
  setUsername,
  email,
  setEmail,
  avatarPreview,
  avatarUrl,
  setAvatarFile,
  setAvatarPreview,
  savePersonal,
  loading,
}) {
  const fileInputRef = React.useRef(null);

  // Modal
  const [open, setOpen] = React.useState(false);

  // Draft no modal
  const [draftSrc, setDraftSrc] = React.useState("");
  const [zoom, setZoom] = React.useState(1);
  const [offset, setOffset] = React.useState({ x: 0, y: 0 });

  // Drag
  const dragRef = React.useRef({
    dragging: false,
    startX: 0,
    startY: 0,
    baseX: 0,
    baseY: 0,
  });

  const currentShownAvatar = avatarPreview || avatarUrl || "";
  const hasImage = Boolean(draftSrc);

  React.useEffect(() => {
    if (!open) return;
    setDraftSrc(currentShownAvatar || "");
    setZoom(1);
    setOffset({ x: 0, y: 0 });
  }, [open]); // snapshot ao abrir

  const openPicker = () => fileInputRef.current?.click();

  const onSelectFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type?.startsWith("image/")) return;

    const max = 2 * 1024 * 1024;
    if (file.size > max) return;

    revokeIfBlob(draftSrc);
    const url = URL.createObjectURL(file);
    setDraftSrc(url);

    // permite selecionar o mesmo arquivo de novo
    e.target.value = "";
  };

  const getOffsetLimits = React.useCallback(async (z = zoom) => {
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

  const clampOffset = React.useCallback(async (x, y, z = zoom) => {
    const lim = await getOffsetLimits(z);
    return {
      x: clamp(x, lim.minX, lim.maxX),
      y: clamp(y, lim.minY, lim.maxY),
    };
  }, [getOffsetLimits, zoom]);

  const onPointerDown = (e) => {
    if (!hasImage) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);

    dragRef.current.dragging = true;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.baseX = offset.x;
    dragRef.current.baseY = offset.y;
  };

  const onPointerMove = async (e) => {
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

  const setZoomSafe = async (nextZoom) => {
    const z = clamp(nextZoom, ZOOM_MIN, ZOOM_MAX);
    setZoom(z);

    // re-clampa offset para o novo zoom
    const clamped = await clampOffset(offset.x, offset.y, z);
    setOffset(clamped);
  };

  const onRemove = () => {
    revokeIfBlob(draftSrc);
    setDraftSrc("");
    setZoom(1);
    setOffset({ x: 0, y: 0 });

    // aplica no form também
    setAvatarFile(null);
    revokeIfBlob(avatarPreview);
    setAvatarPreview("");
  };

  const onApply = async () => {
    if (!draftSrc) return;

    const blob = await cropToSquare({
      src: draftSrc,
      offsetX: offset.x,
      offsetY: offset.y,
      zoom,
    });

    const file = new File([blob], "avatar.jpg", { type: "image/jpeg" });

    setAvatarFile(file);
    revokeIfBlob(avatarPreview);

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
        {/* Avatar (sem botões externos) */}
        <div className="flex items-start gap-4">
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="relative group"
            aria-label="Editar foto de perfil"
            title="Editar foto"
          >
            <div className="h-16 w-16 rounded-2xl border bg-slate-100 overflow-hidden shadow-sm">
              {currentShownAvatar ? (
                <img
                  src={currentShownAvatar}
                  alt="Avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-slate-400">
                  <UserIcon className="w-7 h-7" />
                </div>
              )}
            </div>

            <div className="absolute -bottom-2 -right-2 rounded-full border bg-white shadow-sm p-2 transition group-hover:scale-105">
              <Camera className="w-4 h-4 text-slate-700" />
            </div>
          </button>

          <div className="flex-1">
            <p className="text-sm font-medium text-slate-900">Foto de perfil</p>
            <p className="text-xs text-slate-500">
              Clique no avatar para enviar e ajustar (PNG/JPG até 2MB).
            </p>
          </div>
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
          <Input value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
        </div>

        <Button className="bg-emerald-600 hover:bg-emerald-700" disabled={loading} onClick={savePersonal}>
          Salvar
        </Button>

        {/* MODAL */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="sm:max-w-[520px]">
            <DialogHeader>
              <DialogTitle>Editar foto</DialogTitle>
            </DialogHeader>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={onSelectFile}
            />

            <div className="space-y-4">
              {/* área de crop */}
              <div className="flex flex-col items-center">
                <div
                  className="relative overflow-hidden rounded-2xl border bg-slate-100"
                  style={{ width: CROP_SIZE, height: CROP_SIZE }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                  onClick={() => !draftSrc && openPicker()} // sem botão "Escolher foto"
                  role={!draftSrc ? "button" : undefined}
                  aria-label={!draftSrc ? "Selecionar imagem" : undefined}
                >
                  {draftSrc ? (
                    <>
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

                      {/* GRID (grade) */}
                      <div className="pointer-events-none absolute inset-0">
                        {/* verticais */}
                        <div className="absolute top-0 bottom-0 left-1/3 w-px bg-slate-900/20" />
                        <div className="absolute top-0 bottom-0 left-2/3 w-px bg-slate-900/20" />
                        {/* horizontais */}
                        <div className="absolute left-0 right-0 top-1/3 h-px bg-slate-900/20" />
                        <div className="absolute left-0 right-0 top-2/3 h-px bg-slate-900/20" />
                        {/* moldura leve */}
                        <div className="absolute inset-0 ring-1 ring-slate-900/10" />
                      </div>
                    </>
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center text-slate-500 gap-2">
                      <UserIcon className="w-8 h-8" />
                      <p className="text-sm">Selecione uma imagem</p>
                      <p className="text-xs text-slate-400">
                        Use o botao de upload abaixo (ou clique aqui).
                      </p>
                    </div>
                  )}
                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Dica: arraste para posicionar.
                </p>
              </div>

              {/* Zoom com + e - */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-sm text-slate-700">Zoom</p>
                    <p className="text-xs text-slate-500">{Math.round(zoom * 100)}%</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setZoomSafe(zoom - ZOOM_STEP)}
                      disabled={!draftSrc || zoom <= ZOOM_MIN + 1e-6}
                      aria-label="Diminuir zoom"
                      title="Diminuir zoom"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>

                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      className="rounded-full"
                      onClick={() => setZoomSafe(zoom + ZOOM_STEP)}
                      disabled={!draftSrc || zoom >= ZOOM_MAX - 1e-6}
                      aria-label="Aumentar zoom"
                      title="Aumentar zoom"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="gap-2"
                    onClick={openPicker}
                    aria-label="Selecionar imagem"
                    title="Selecionar imagem"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Selecionar foto</span>
                  </Button>

                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    className="gap-2"
                    onClick={onRemove}
                    disabled={!draftSrc}
                    aria-label="Remover foto"
                    title="Remover foto"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Remover</span>
                  </Button>
                </div>
              </div>


              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={onApply}
                  disabled={!draftSrc}
                >
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


