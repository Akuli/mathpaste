/* tslint:disable */

declare namespace MathJax {
    class Hub {
      public static processSectionDelay: number;

      public static Register: {
        StartupHook: (arg0: string, arg1: () => void) => void;
      };

      public static Queue(arg0: [string, any, HTMLElement]): void;

      public static Configured(): void;
    }
}
