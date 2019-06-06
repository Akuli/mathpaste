declare namespace MathJax {
    class Hub {
      static processSectionDelay: number;

      static Queue(arg0: [string, any, HTMLElement]): void;

      static Configured(): void;

      static Register: {
        StartupHook: (arg0: string, arg1: () => void) => void;
      }
    }
}
