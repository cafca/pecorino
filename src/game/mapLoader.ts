import { DOMParser } from "xmldom";
import { Assets, Texture, Container, Rectangle, Sprite } from "pixi.js";

export interface TiledTileset {
  firstgid: number;
  source: never; // don't use this
}

export interface TiledLayer {
  data: number[];
  height: number;
  id: number;
  name: string;
  opacity: number;
  type: string;
  visible: boolean;
  width: number;
  x: number;
  y: number;
}

export interface TiledMap {
  compressionlevel: number;
  height: number;
  infinite: boolean;
  layers: TiledLayer[];
  nextlayerid: number;
  nextobjectid: number;
  orientation: string;
  renderorder: string;
  tiledversion: string;
  tileheight: number;
  tilesets: TiledTileset[];
  tilewidth: number;
  type: string;
  version: string;
  width: number;
}

interface TilesetProperties {
  tileWidth: number;
  tileHeight: number;
  columns: number;
}

export class MapLoader {
  private texturePool = new Map<number, Texture>();

  // eslint-disable-next-line no-undef
  private parseTileset(tilesetElem: Element): TilesetProperties {
    const tileWidth = tilesetElem.getAttribute("tilewidth");
    const tileHeight = tilesetElem.getAttribute("tileheight");
    const columns = tilesetElem.getAttribute("columns");

    if (!tileWidth || !tileHeight || !columns) {
      console.error("Failed to parse tileset XML");
      return {
        tileWidth: 0,
        tileHeight: 0,
        columns: 0,
      };
    }

    return {
      tileWidth: parseInt(tileWidth),
      tileHeight: parseInt(tileHeight),
      columns: parseInt(columns),
    };
  }

  public async loadMap(
    gameContainer: Container
  ): Promise<{ width: number; height: number }> {
    // Load map data
    const mapData = Assets.get<TiledMap>("map");
    const tilesheet = Assets.get<Texture>("tilesheet");
    const tilesetXml = Assets.get<string>("tileset");

    if (!mapData || !tilesheet || !tilesetXml) {
      console.error("Failed to load map assets");
      return { width: 0, height: 0 };
    }

    // Parse tileset XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(tilesetXml, "application/xml");
    const tilesetElem = doc.getElementsByTagName("tileset")[0];

    if (!tilesetElem) {
      console.error("Failed to parse tileset XML");
      return { width: 0, height: 0 };
    }

    // Calculate map dimensions
    const mapWidth = mapData.width * mapData.tilewidth;
    const mapHeight = mapData.height * mapData.tileheight;

    // Create a container for the map
    const mapContainer = new Container();
    gameContainer.addChild(mapContainer);
    mapContainer.position.set(-mapWidth / 2, -mapHeight / 2);

    // Get tileset properties
    const { tileWidth, tileHeight, columns } = this.parseTileset(tilesetElem);

    // Add tiles from the map data
    mapData.layers.forEach((layer: TiledLayer) => {
      if (layer.type === "tilelayer") {
        layer.data.forEach((tileId: number, index: number) => {
          if (tileId === 0) return; // Skip empty tiles

          // Calculate tile position in the world
          const x = (index % mapData.width) * tileWidth;
          const y = Math.floor(index / mapData.width) * tileHeight;

          // Get or create texture for this tile type
          let tileTexture = this.texturePool.get(tileId);
          if (!tileTexture) {
            // Calculate tile position in the tileset
            // Subtract 1 from tileId because Tiled uses 1-based indices
            const tileIndex = tileId - 1;
            const tx = (tileIndex % columns) * tileWidth;
            const ty = Math.floor(tileIndex / columns) * tileHeight;

            // uses Pixi v8 syntax
            tileTexture = new Texture({
              source: tilesheet.source,
              frame: new Rectangle(tx, ty, tileWidth, tileHeight),
            });

            this.texturePool.set(tileId, tileTexture);
          }

          // Create a sprite for this tile
          const tileSprite = new Sprite(tileTexture!);
          tileSprite.position.set(x, y);
          mapContainer.addChild(tileSprite);
        });
      }
    });

    return { width: mapWidth, height: mapHeight };
  }
}
