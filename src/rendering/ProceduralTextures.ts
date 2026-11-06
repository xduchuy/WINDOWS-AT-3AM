import { DynamicTexture, Scene, Texture } from '@babylonjs/core';

/**
 * Generates high-detail procedural PBR textures (brick albedo, mortar normal map,
 * vertical rain-streak roughness map, herringbone parquet floor, baked room lightmap,
 * and window condensation droplet map) so materials look richly art-directed.
 */
export class ProceduralTextures {
  public static createWeatheredBrickAlbedo(scene: Scene): DynamicTexture {
    const tex = new DynamicTexture('brickAlbedo', { width: 512, height: 512 }, scene, true);
    const ctx = tex.getContext();

    // Dark mortar base
    ctx.fillStyle = '#181c24';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 16;
    const cols = 8;
    const brickH = 512 / rows;
    const brickW = 512 / cols;

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (brickW * 0.5);
      for (let c = -1; c <= cols; c++) {
        const x = c * brickW + offset;
        const y = r * brickH;
        const shade = ((r * 17 + c * 31) % 24) - 12;
        const red = Math.max(28, Math.min(72, 48 + shade));
        const green = Math.max(22, Math.min(54, 34 + Math.floor(shade * 0.6)));
        const blue = Math.max(24, Math.min(58, 36 + Math.floor(shade * 0.5)));
        ctx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctx.fillRect(x + 2, y + 2, brickW - 4, brickH - 4);
      }
    }

    // Vertical dark rainwater weathering streaks
    for (let s = 0; s < 28; s++) {
      const sx = (s * 47) % 512;
      const grad = ctx.createLinearGradient(sx, 0, sx, 512);
      grad.addColorStop(0, 'rgba(6, 10, 16, 0.45)');
      grad.addColorStop(0.5, 'rgba(8, 12, 18, 0.15)');
      grad.addColorStop(1, 'rgba(5, 8, 14, 0.5)');
      ctx.fillStyle = grad;
      ctx.fillRect(sx, 0, 10 + (s % 9), 512);
    }

    tex.wrapU = Texture.WRAP_ADDRESSMODE;
    tex.wrapV = Texture.WRAP_ADDRESSMODE;
    tex.update();
    return tex;
  }

  public static createWetRoughnessMap(scene: Scene): DynamicTexture {
    const tex = new DynamicTexture('wetRoughness', { width: 256, height: 256 }, scene, true);
    const ctx = tex.getContext();
    ctx.fillStyle = 'rgb(165, 165, 165)';
    ctx.fillRect(0, 0, 256, 256);

    // Glossy vertical water runoff channels (darker = lower roughness = mirror-wet in Babylon metallicRoughness green channel)
    for (let i = 0; i < 36; i++) {
      const x = (i * 29) % 256;
      ctx.fillStyle = i % 2 === 0 ? 'rgb(45, 55, 210)' : 'rgb(85, 95, 180)';
      ctx.fillRect(x, 0, 4 + (i % 6), 256);
    }

    tex.wrapU = Texture.WRAP_ADDRESSMODE;
    tex.wrapV = Texture.WRAP_ADDRESSMODE;
    tex.update();
    return tex;
  }

  public static createInteriorWallpaperAndLightmap(
    scene: Scene,
    name: string,
    baseHex: string,
    warmGlowHex: string
  ): DynamicTexture {
    const tex = new DynamicTexture(name, { width: 256, height: 256 }, scene, true);
    const ctx = tex.getContext();

    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 256, 256);

    // Subtle wainscot & vertical stripe motif
    ctx.fillStyle = 'rgba(255, 255, 255, 0.04)';
    for (let x = 0; x < 256; x += 16) {
      ctx.fillRect(x, 0, 6, 256);
    }

    // Lower wainscot dado rail
    ctx.fillStyle = 'rgba(10, 12, 16, 0.38)';
    ctx.fillRect(0, 185, 256, 71);

    // Baked indirect warm radial bounce lightmap in center
    const grad = ctx.createRadialGradient(128, 110, 12, 128, 128, 135);
    grad.addColorStop(0, warmGlowHex);
    grad.addColorStop(0.65, 'rgba(25, 20, 16, 0.18)');
    grad.addColorStop(1, 'rgba(4, 6, 10, 0.72)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    tex.update();
    return tex;
  }

  public static createWindowDropletTexture(scene: Scene): DynamicTexture {
    const tex = new DynamicTexture('windowDroplets', { width: 256, height: 256 }, scene, true);
    const ctx = tex.getContext();

    ctx.fillStyle = 'rgba(140, 175, 210, 0.16)';
    ctx.fillRect(0, 0, 256, 256);

    // Condensation border around window sash edges
    const grad = ctx.createRadialGradient(128, 128, 60, 128, 128, 140);
    grad.addColorStop(0, 'rgba(180, 210, 235, 0.05)');
    grad.addColorStop(1, 'rgba(195, 225, 245, 0.36)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    // Rain droplet trails
    ctx.fillStyle = 'rgba(230, 245, 255, 0.42)';
    for (let d = 0; d < 90; d++) {
      const dx = (d * 53) % 250;
      const dy = (d * 71) % 245;
      ctx.fillRect(dx, dy, 1.5, 5 + (d % 9));
    }

    tex.hasAlpha = true;
    tex.update();
    return tex;
  }
}
