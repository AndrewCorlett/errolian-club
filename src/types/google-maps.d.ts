// Google Maps types for web
declare global {
  namespace google {
    namespace maps {
      class Map {
        constructor(mapDiv: Element, opts?: MapOptions);
        setCenter(latLng: LatLng | LatLngLiteral): void;
        setZoom(zoom: number): void;
        addListener(eventName: string, handler: () => void): void;
        panTo(latLng: LatLng | LatLngLiteral): void;
        getZoom(): number;
        getCenter(): LatLng;
      }

      class Marker {
        constructor(opts?: MarkerOptions);
        setPosition(latLng: LatLng | LatLngLiteral): void;
        setMap(map: Map | null): void;
        addListener(eventName: string, handler: () => void): void;
        setTitle(title: string): void;
        setIcon(icon: string | Icon): void;
      }

      class InfoWindow {
        constructor(opts?: InfoWindowOptions);
        open(map?: Map, anchor?: Marker): void;
        close(): void;
        setContent(content: string | Element): void;
      }

      class LatLng {
        constructor(lat: number, lng: number);
        lat(): number;
        lng(): number;
      }

      namespace places {
        class Autocomplete {
          constructor(input: HTMLInputElement, opts?: AutocompleteOptions);
          addListener(eventName: string, handler: () => void): void;
          getPlace(): PlaceResult;
        }

        interface PlaceResult {
          place_id?: string;
          name?: string;
          formatted_address?: string;
          geometry?: {
            location?: LatLng;
          };
          url?: string;
          website?: string;
          formatted_phone_number?: string;
        }

        interface AutocompleteOptions {
          fields?: string[];
          types?: string[];
        }
      }

      namespace event {
        function addListener(instance: any, eventName: string, handler: () => void): void;
        function removeListener(listener: any): void;
        function clearInstanceListeners(instance: any): void;
      }

      interface MapOptions {
        center?: LatLng | LatLngLiteral;
        zoom?: number;
        mapTypeId?: MapTypeId;
        disableDefaultUI?: boolean;
        zoomControl?: boolean;
        mapTypeControl?: boolean;
        scaleControl?: boolean;
        streetViewControl?: boolean;
        rotateControl?: boolean;
        fullscreenControl?: boolean;
      }

      interface MarkerOptions {
        position?: LatLng | LatLngLiteral;
        map?: Map;
        title?: string;
        animation?: Animation;
      }

      interface InfoWindowOptions {
        content?: string | Element;
      }

      interface LatLngLiteral {
        lat: number;
        lng: number;
      }

      interface Icon {
        url: string;
        size?: Size;
        origin?: Point;
        anchor?: Point;
        scaledSize?: Size;
      }

      class Size {
        constructor(width: number, height: number, widthUnit?: string, heightUnit?: string);
      }

      class Point {
        constructor(x: number, y: number);
      }

      enum MapTypeId {
        ROADMAP = 'roadmap',
        SATELLITE = 'satellite',
        HYBRID = 'hybrid',
        TERRAIN = 'terrain',
      }

      enum Animation {
        DROP = 'drop',
        BOUNCE = 'bounce',
      }
    }
  }
}

export {};