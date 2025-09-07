import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ny(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fetchCallback = ({
  setIsPending,
}: {
  setIsPending: (value: boolean) => void;
}) => {
  return {
    onRequest: () => {
      setIsPending(true);
    },
    onResponse: () => {
      setIsPending(false);
    },
  };
};

export const capitalizeFirstLetter = (str: string) => {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

export const trim = (text: string, length: number) => {
  if (text.length > length) {
    return text.substring(0, length) + "...";
  }
  return text;
};

export const isText = (type: string) => {
  return type === "textbox" || type === "text";
};

export const downloadFile = (dataUrl: string, format: string) => {
  const link = document.createElement("a");
  link.download = `arture-export.${format}`;
  link.href = dataUrl;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadPdf = async (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${filename}.pdf`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const transformText = async (objects: any[]) => {
  if (!objects) return;

  for (const object of objects) {
    if (isText(object.type)) {
      if (object.text) {
        object.text = object.text.toString();
      }
      if (object.fontSize) {
        object.fontSize = Number(object.fontSize);
      }
      if (object.fontWeight) {
        object.fontWeight = Number(object.fontWeight);
      }
    }
  }
};

export const rgbaObjectToString = (rgba: any) => {
  return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
};
