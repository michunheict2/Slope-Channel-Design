declare module '@mapbox/mapbox-gl-draw' {
  interface DrawOptions {
    defaultMode?: string;
    styles?: unknown[];
    displayControlsDefault?: boolean;
    controls?: {
      point?: boolean;
      line_string?: boolean;
      polygon?: boolean;
      trash?: boolean;
      combine_features?: boolean;
      uncombine_features?: boolean;
    };
  }
  
  class MapboxDraw {
    constructor(options?: DrawOptions);
    add(geojson: unknown): string[];
    delete(ids: string[]): void;
    delete(id: string): void;
    getAll(): unknown;
    getSelected(): unknown;
    getSelectedIds(): string[];
    getMode(): string;
    changeMode(mode: string, options?: unknown): void;
    setFeatureProperty(id: string, property: string, value: unknown): void;
    on(type: string, listener: (e: unknown) => void): void;
    off(type: string, listener: (e: unknown) => void): void;
  }
  
  export = MapboxDraw;
}
