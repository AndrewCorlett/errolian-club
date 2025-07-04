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

      namespace marker {
        class AdvancedMarkerElement {
          constructor(opts?: AdvancedMarkerElementOptions);
          position: LatLng | LatLngLiteral | null;
          map: Map | null;
          title: string;
          content: HTMLElement | null;
          addListener(eventName: string, handler: () => void): void;
        }

        class PinElement {
          constructor(opts?: PinElementOptions);
          element: HTMLElement;
          background?: string;
          borderColor?: string;
          glyphColor?: string;
        }

        interface AdvancedMarkerElementOptions {
          position?: LatLng | LatLngLiteral;
          map?: Map;
          title?: string;
          content?: HTMLElement;
        }

        interface PinElementOptions {
          background?: string;
          borderColor?: string;
          glyphColor?: string;
        }
      }

      class InfoWindow {
        constructor(opts?: InfoWindowOptions);
        open(map?: Map, anchor?: Marker | marker.AdvancedMarkerElement): void;
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

        class PlaceAutocompleteElement extends HTMLElement {
          constructor(options?: PlaceAutocompleteElementOptions);
          addEventListener(type: string, listener: EventListener): void;
          removeEventListener(type: string, listener: EventListener): void;
          includedPrimaryTypes?: string[];
          includedRegionCodes?: string[];
          locationBias?: any;
          locationRestriction?: any;
          name?: string;
          origin?: LatLng | LatLngLiteral;
          requestedLanguage?: string;
          requestedRegion?: string;
        }

        interface PlaceAutocompleteElementOptions {
          includedPrimaryTypes?: string[];
          includedRegionCodes?: string[];
          locationBias?: any;
          locationRestriction?: any;
          name?: string;
          origin?: LatLng | LatLngLiteral;
          requestedLanguage?: string;
          requestedRegion?: string;
        }

        interface PlacePrediction {
          toPlace(): Place;
        }

        interface Place {
          fetchFields(options: { fields: string[] }): Promise<void>;
          displayName?: string;
          formattedAddress?: string;
          location?: LatLng;
          viewport?: any;
          id?: string;
          name?: string;
          formatted_address?: string;
          geometry?: {
            location?: LatLng;
          };
          url?: string;
          website?: string;
          formatted_phone_number?: string;
        }

        interface PlacePredictionSelectEvent extends Event {
          placePrediction: PlacePrediction;
        }

        class PlacesService {
          constructor(attrContainer: HTMLDivElement | Map);
          getDetails(request: PlaceDetailsRequest, callback: (place: PlaceResult | null, status: PlacesServiceStatus) => void): void;
        }

        interface PlaceDetailsRequest {
          placeId: string;
          fields?: string[];
        }

        enum PlacesServiceStatus {
          OK = 'OK',
          ZERO_RESULTS = 'ZERO_RESULTS',
          OVER_QUERY_LIMIT = 'OVER_QUERY_LIMIT',
          REQUEST_DENIED = 'REQUEST_DENIED',
          INVALID_REQUEST = 'INVALID_REQUEST',
          NOT_FOUND = 'NOT_FOUND',
          UNKNOWN_ERROR = 'UNKNOWN_ERROR'
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
          componentRestrictions?: undefined;
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
        mapId?: string;
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

      interface MapsLibrary {
        Map: typeof Map;
        InfoWindow: typeof InfoWindow;
        LatLng: typeof LatLng;
      }

      interface MarkerLibrary {
        AdvancedMarkerElement: typeof marker.AdvancedMarkerElement;
        PinElement: typeof marker.PinElement;
        Marker: typeof Marker;
      }

      function importLibrary(name: string): Promise<MapsLibrary | MarkerLibrary>;
    }
  }
}

export {};