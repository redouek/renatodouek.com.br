
export enum Mode {
  Create = 'create',
  Edit = 'edit',
}

export enum CreateFunction {
  Free = 'free',
  Sticker = 'sticker',
  Text = 'text',
  Comic = 'comic',
}

export enum EditFunction {
  AddRemove = 'add-remove',
  Retouch = 'retouch',
  Style = 'style',
  Compose = 'compose',
}

export type AspectRatio = '1:1' | '16:9' | '9:16' | '4:3' | '3:4';

export interface ImageFile {
  base64: string;
  mimeType: string;
}
