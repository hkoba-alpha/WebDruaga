/**
 * ギルのイメージの重ね合わせ順
 * 0: head (gil0x)
 * 1: body (gil1x)
 * 2: shield (gil2x)
 * 3: sword (gil3x)
 * 4: left-hand (gil4x, 0-4: shieldと同じ)
 * 5: right-hand (gil4x, 4-9: 剣と同じ)
 */
const gilImageIndex = [
    [2, 3, 4, 5, 1, 0], // UP
    [2, 4, 1, 0, 3, 5], // RIGHT
    [1, 0, 4, 5, 3, 2], // DOWN
    [5, 3, 1, 0, 4, 2]  // LEFT
];
// GIL: ４方向 x 6パターン, 0,1: 剣をしまっている, 2,3,4: 剣を振り始めているor閉じている, 5: 剣を出している
// shield: 0, 0, 0, 1, 2, 3

/**
 * 読み込み済みのマップ
 */
let spriteImageMap: { [key: string]: ImageData } = {};

function loadSpriteImage(fname: string): Promise<ImageData> {
    if (fname in spriteImageMap) {
        return Promise.resolve(spriteImageMap[fname]);
    }
    const img = new Image();
    return new Promise((resolve, reject) => {
        img.onload = () => {
            console.log("Load Image", fname, img.width, img.height);
            const canvas = document.createElement("canvas");
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d')!;
            ctx.drawImage(img, 0, 0);
            const data = ctx.getImageData(0, 0, img.width, img.height);
            // 透明の処理
            const trans = [data.data[0], data.data[1], data.data[2], data.data[3]];
            for (let y = 0; y < img.height; y++) {
                for (let x = 0; x < img.width; x++) {
                    const ix = (y * img.width + x) * 4;
                    if (data.data[ix] === trans[0] && data.data[ix + 1] === trans[1] && data.data[ix + 2] === trans[2] && data.data[ix + 3] === trans[3]) {
                        data.data[ix + 3] = 0;
                    }
                }
            }
            spriteImageMap[fname] = data;
            resolve(data);
        };
        img.src = `images/${fname}.png`;
    });
}

const SPRITE_SIZE = 48;

export class SpriteData {
    public readonly texData: WebGLTexture;
    protected width: number = 0;
    protected height: number = 0;

    public constructor(gl: WebGL2RenderingContext, fname: string) {
        const smallSize = ["item", "Spell", "Rod"];
        this.texData = gl.createTexture()!;
        loadSpriteImage(fname).then(img => {
            if (smallSize.includes(fname)) {
                this.setTexture(gl, img, 32);
            } else {
                this.setTexture(gl, img);
            }
        });
    }

    protected setTexture(gl: WebGL2RenderingContext, img: ImageData, size: number = SPRITE_SIZE): void {
        this.width = Math.round(img.width / size);
        this.height = Math.round(img.height / size);
        gl.bindTexture(gl.TEXTURE_2D, this.texData);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    }

    public getTexRect(ix: number): {
        sx: number;
        sy: number;
        ex: number;
        ey: number;
    } {
        if (!this.width) {
            // まだロード中
            return {
                sx: 0,
                sy: 0,
                ex: 1,
                ey: 1
            };
        }
        const x = (ix % this.width);
        const y = Math.floor(ix / this.width);
        return {
            sx: x / this.width,
            ex: (x + 1) / this.width,
            sy: y / this.height,
            ey: (y + 1) / this.height
        };
    }

    public close(gl: WebGL2RenderingContext): void {
        gl.deleteTexture(this.texData);
    }
}

export class PlayerSpriteData extends SpriteData {
    public readonly bodyTex: WebGLTexture;

    public constructor(gl: WebGL2RenderingContext) {
        super(gl, "gil50");
        this.bodyTex = gl.createTexture()!;
        //this.setState(gl, equip);
    }
    /**
     * 装備情報を設定する
     * @param gl
     * @param equip 0:ヘルメット, 1:アーマー, 2:シールド, 3:ソード, 4:ガントレット, 5:ブーツ
     */
    public setState(gl: WebGL2RenderingContext, equip: number[]): void {
        let tmp: Promise<ImageData>[] = [];
        for (let i = 0; i < 6; i++) {
            tmp.push(loadSpriteImage(`gil${i}${equip[i]}`));
        }
        Promise.all(tmp).then(imglst => {
            this.setTexture(gl, imglst[5]);
            const canvas = document.createElement("canvas");
            const wd = 6 * SPRITE_SIZE;
            const ht = 4 * SPRITE_SIZE;
            const ctx = canvas.getContext('2d')!;
            const img = ctx.createImageData(wd, ht);
            // 透明にする
            for (let i = 3; i < img.data.length; i += 4) {
                img.data[i] = 0;
            }
            for (let iy = 0; iy < 4; iy++) {
                for (let ix = 0; ix < 6; ix++) {
                    let sx = [0, 0, 0, 0, 0, 3 + ix];
                    // シールド
                    if (ix >= 3) {
                        sx[2] = sx[4] = (ix === 5 ? 2 : 1);
                    }
                    if (ix >= 2) {
                        sx[3] = ix - 1;
                    }
                    this.drawImageData(img, ix, iy, gilImageIndex[iy], imglst, sx);
                }
            }
            gl.bindTexture(gl.TEXTURE_2D, this.bodyTex);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);
        });
    }

    private drawImageData(dest: ImageData, dx: number, dy: number, order: number[], src: ImageData[], sx: number[]): void {
        const base = (dy * SPRITE_SIZE * dest.width + dx * SPRITE_SIZE) * 4;
        for (let od of order) {
            // 4, 5は両方同じ腕
            const img = src[Math.min(od, 4)];
            const srcbase = (dy * SPRITE_SIZE * img.width + sx[od] * SPRITE_SIZE) * 4;
            for (let y = 0; y < SPRITE_SIZE; y++) {
                for (let x = 0; x < SPRITE_SIZE; x++) {
                    const six = srcbase + (y * img.width + x) * 4;
                    if (img.data[six + 3]) {
                        // 透明ではない
                        const dix = base + (y * dest.width + x) * 4;
                        for (let j = 0; j < 4; j++) {
                            dest.data[dix + j] = img.data[six + j];
                        }
                    }
                }
            }
        }
    }

    public getBodyTexRect(ix: number): {
        sx: number;
        sy: number;
        ex: number;
        ey: number;
    } {
        const x = ix % 6;
        const y = Math.floor(ix / 6);
        return {
            sx: x / 6.0,
            sy: y / 4.0,
            ex: (x + 1) / 6.0,
            ey: (y + 1) / 4.0
        };
    }
}

/**
 * イメージを先に読み出しておく
 */
export function preloadImages() {
    const imageList = [
        "stage", "item",
        "gil00", "gil01", "gil10", "gil11", "gil12", "gil20", "gil21", "gil22",
        "gil30", "gil31", "gil32", "gil33", "gil40", "gil41", "gil42", "gil50", "gil51",
        "BLACK_Dragon", "BLACK_Knight", "BLACK_Slime",
        "BLUE_Knight", "BLUE_Roper", "BLUE_Slime",
        "DemonDruaga",
        "DKGREEN_Slime", "DKYELLOW_Slime",
        "DLUID_Ghost", "DLUID",
        "DragonFire",
        "GREEN_Roper", "GREEN_Slime",
        "HYPER_Knight", "Ishtar",
        "LIZARD_Knight", "MAGE_Ghost", "MAGE",
        "MIRROR_Knight", "QUOX_Dragon",
        "RED_Knight", "RED_Roper", "RED_Slime",
        "Rod", "SILVER_Dragon",
        "SORCERER", "Spell_Fire", "Spell",
        "Wisp", "WIZARD_Ghost", "WIZARD"
    ];
    for (let img of imageList) {
        loadSpriteImage(img).then();
    }
}