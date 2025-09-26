declare module '@mapbox/mapbox-gl-draw' {
  import { Map } from 'mapbox-gl';
  
  interface DrawOptions {
    defaultMode?: string;
    styles?: any[];
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
    add(geojson: any): string[];
    delete(ids: string[]): void;
    delete(id: string): void;
    getAll(): any;
    getSelected(): any;
    getSelectedIds(): string[];
    getMode(): string;
    changeMode(mode: string, options?: any): void;
    setFeatureProperty(id: string, property: string, value: any): void;
    on(type: string, listener: (e: any) => void): void;
    off(type: string, listener: (e: any) => void): void;
  }
  
  export = MapboxDraw;
}
