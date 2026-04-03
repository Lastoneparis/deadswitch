declare module 'shamirs-secret-sharing' {
  interface SplitOptions {
    shares: number;
    threshold: number;
  }
  function split(secret: Buffer, opts: SplitOptions): Buffer[];
  function combine(shares: Buffer[]): Buffer;
}
