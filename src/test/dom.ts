// Small helpers that drive the DOM the way a user would.

export function typeInto(input: HTMLInputElement | HTMLTextAreaElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event("input", { bubbles: true }));
}

export function leave(input: HTMLElement): void {
  input.dispatchEvent(new Event("blur"));
}

export function query<T extends HTMLElement>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`No element matches ${selector}`);
  }
  return element;
}

// Lets pending promise callbacks (mocked requests) settle.
export function flush(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
