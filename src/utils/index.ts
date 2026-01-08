export function createPageUrl(pageName: string) {
    return '/' + pageName.replace(/ /g, '-');
}

export { fetchViaCep } from './viacep';
