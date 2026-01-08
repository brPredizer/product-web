export type ViaCepAddress = {
  zipCode: string;
  street: string;
  neighborhood: string;
  number?: string;
  complement: string;
  city: string;
  state: string;
  country?: string;
};

const normalizeCep = (value: string) => String(value || '').replace(/\D/g, '');

export const fetchViaCep = async (cep: string): Promise<ViaCepAddress | null> => {
  const normalized = normalizeCep(cep);
  if (normalized.length !== 8) return null;

  const res = await fetch(`https://viacep.com.br/ws/${normalized}/json/`);
  const data = await res.json();

  if (!res.ok || data?.erro) return null;

  return {
    zipCode: normalizeCep(data?.cep || normalized),
    street: data?.logradouro || '',
    neighborhood: data?.bairro || '',
    complement: data?.complemento || '',
    city: data?.localidade || '',
    state: data?.uf || ''
  };
};
