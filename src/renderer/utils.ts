export const replaceText = (selector: string, text: string) => {
  const element = document.getElementById(selector);
  if (element) element.innerText = text;
};

export const addText = (selector: string, text: string) => {
  const element = document.getElementById(selector);
  if (element) element.innerText += text + "\n";
};

export const addSelectList = (selector: string, text: string) => {
  const element = document.getElementById(selector) as HTMLSelectElement;
  if (element) {
    const option = document.createElement("option");
    option.value = text;
    option.text = text;
    element.appendChild(option);
  }
};

export const makeRandomString = (length: number) => {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
};
