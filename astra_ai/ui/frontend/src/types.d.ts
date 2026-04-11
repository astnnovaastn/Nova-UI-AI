declare module '*.jsx' {
  const component: any;
  export default component;
}

declare module '*.css' {
  const styles: { [key: string]: string };
  export default styles;
}