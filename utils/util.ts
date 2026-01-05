export const CreateSlug = (text: string): string => {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

export const toNonAccentVietnamese = (str: string): string => {
  return str
    .replace(/A|Á|À|Ã|Ạ|Ả|Â|Ấ|Ầ|Ẫ|Ậ|Ă|Ắ|Ằ|Ẵ|Ặ/g, 'A')
    .replace(/à|á|ạ|ả|ã|â|ầ|ấ|ậ|ẩ|ẫ|ă|ằ|ắ|ặ|ẳ|ẵ/g, 'a')
    .replace(/E|É|È|Ẽ|Ẹ|Ê|Ế|Ề|Ễ|Ể|Ệ/g, 'E')
    .replace(/è|é|ẹ|ẻ|ẽ|ê|ề|ế|ệ|ể|ễ/g, 'i')
    .replace(/I|Í|Ì|Ĩ|Ị/g, 'I')
    .replace(/ì|í|ị|ỉ|ĩ/g, 'i')
    .replace(/O|Ó|Ò|Õ|Ọ|Ô|Ổ|Ố|Ồ|Ỗ|Ộ|Ơ|Ớ|Ờ|Ỡ|Ợ/g, 'O')
    .replace(/ò|ó|ọ|ỏ|õ|ô|ồ|ố|ộ|ổ|ỗ|ơ|ờ|ớ|ợ|ở|ỡ/g, 'o')
    .replace(/U|Ú|Ù|Ũ|Ụ|Ư|Ứ|Ừ|Ữ|Ự/g, 'U')
    .replace(/ù|ú|ụ|ủ|ũ|ư|ừ|ứ|ự|ử|ữ/g, 'u')
    .replace(/Y|Ý|Ỳ|Ỹ|Ỵ/g, 'Y')
    .replace(/ỳ|ý|ỵ|ỷ|ỹ/g, 'y')
    .replace(/Đ/g, 'D')
    .replace(/đ/g, 'd');
};

export const normalize = (string): string => {
  const normalizedString: string = String(string).toLowerCase();
  return toNonAccentVietnamese(normalizedString);
};

export const parseDuration = (time?: string): number | undefined => {
  if (!time) return undefined;

  const match = time.match(/\d+/);
  if (!match) return undefined;

  const value = Number(match[0]);
  return Number.isNaN(value) ? undefined : value;
};

export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};
