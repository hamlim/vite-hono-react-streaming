declare global {
  var ssrContext: {
    url: string;
    headers: Record<string, string>;
  };
}

export {};
