import { StartRender, getStartRender } from "./FloorStart";
import { FontRender, getFontRender } from "./FontRender";
import { IPlay, StickData } from "./PlayData";
import { SpriteData } from "./SpriteData";
import { StageData } from "./StageData";
import { StageRender, getStageRender } from "./StagePlay";
import { TitlePlay } from "./TitlePlay";

const clearMessge = [
    "CONGRATULATIONS !!",
    "",
    "NOW YOU SAVE KI",
    "AND",
    "THE ADVENTURE IS OVER",
    "",
    "",
    "ITEMS AND CASTS"
];

interface CastData {
    name: string;
    file: string;
    // [dir, time]
    timer: number[];
}

function makeSpellTimer(base: number) {
    let ret: number[] = [];
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 8; j++) {
            ret.push(base + i, 2, -1, 2);
        }
    }
    return ret;
}
const castDataList: CastData[] = [
    { name: "GREEN SLIME", file: "GREEN_Slime", timer: [0, 60, 1, 2, 0, 2, 2, 2, 0, 2, 1, 2, 0, 2, 2, 2] },
    { name: "BLACK SLIME", file: "BLACK_Slime", timer: [0, 60, 1, 2, 0, 2, 2, 2, 0, 2, 1, 2, 0, 2, 2, 2] },
    { name: "RED SLIME", file: "RED_Slime", timer: [0, 60, 1, 2, 0, 2, 2, 2, 0, 2, 1, 2, 0, 2, 2, 2] },
    { name: "BLUE SLIME", file: "BLUE_Slime", timer: [0, 60, 1, 2, 0, 2, 2, 2, 0, 2, 1, 2, 0, 2, 2, 2] },
    { name: "DARK GREEN SLIME", file: "DKGREEN_Slime", timer: [0, 60, 1, 2, 0, 2, 2, 2, 0, 2, 1, 2, 0, 2, 2, 2] },
    { name: "DARK YELLOW SLIME", file: "DKYELLOW_Slime", timer: [0, 60, 1, 2, 0, 2, 2, 2, 0, 2, 1, 2, 0, 2, 2, 2] },
    //
    { name: "MAGE", file: "MAGE", timer: [2, 60, 3, 5, 0, 5, 1, 5] },
    { name: "MAGE SPELL", file: "Spell", timer: makeSpellTimer(0) },
    { name: "DRUID", file: "DLUID", timer: [2, 60, 3, 5, 0, 5, 1, 5] },
    { name: "DRUID SPELL", file: "Spell", timer: makeSpellTimer(4) },
    { name: "SORCERER", file: "SORCERER", timer: [2, 60, 3, 5, 0, 5, 1, 5] },
    { name: "SORCERER SPELL", file: "Spell", timer: makeSpellTimer(8) },
    { name: "WIZARD", file: "WIZARD", timer: [2, 60, 3, 5, 0, 5, 1, 5] },
    { name: "WIZARD SPELL", file: "Spell", timer: makeSpellTimer(12) },
    { name: "MAGE GHOST", file: "MAGE_Ghost", timer: [2, 60, 3, 5, 0, 5, 1, 5] },
    { name: "DRUID GHOST", file: "DLUID_Ghost", timer: [2, 60, 3, 5, 0, 5, 1, 5] },
    { name: "WIZARD GHOST", file: "WIZARD_Ghost", timer: [2, 60, 3, 5, 0, 5, 1, 5] },
    //
    { name: "FIRE ELEMENT", file: "Spell_Fire", timer: [0, 4, 1, 4, 2, 4, 3, 4] },
    // knight
    { name: "BLUE KNIGHT", file: "BLUE_Knight", timer: [0, 15, 1, 15, 0, 15, 1, 15, 2, 15, 3, 15, 2, 15, 3, 15, 4, 15, 5, 15, 4, 15, 5, 15, 6, 15, 7, 15, 6, 15, 7, 15] },
    { name: "BLACK KNIGHT", file: "BLACK_Knight", timer: [0, 15, 1, 15, 0, 15, 1, 15, 2, 15, 3, 15, 2, 15, 3, 15, 4, 15, 5, 15, 4, 15, 5, 15, 6, 15, 7, 15, 6, 15, 7, 15] },
    { name: "MIRROR KNIGHT", file: "MIRROR_Knight", timer: [0, 15, 1, 15, 0, 15, 1, 15, 2, 15, 3, 15, 2, 15, 3, 15, 4, 15, 5, 15, 4, 15, 5, 15, 6, 15, 7, 15, 6, 15, 7, 15] },
    { name: "HYPER KNIGHT", file: "HYPER_Knight", timer: [0, 15, 1, 15, 0, 15, 1, 15, 2, 15, 3, 15, 2, 15, 3, 15, 4, 15, 5, 15, 4, 15, 5, 15, 6, 15, 7, 15, 6, 15, 7, 15] },
    { name: "RED KNIGHT", file: "RED_Knight", timer: [0, 15, 1, 15, 0, 15, 1, 15, 2, 15, 3, 15, 2, 15, 3, 15, 4, 15, 5, 15, 4, 15, 5, 15, 6, 15, 7, 15, 6, 15, 7, 15] },
    { name: "LIZARD MAN", file: "LIZARD_Knight", timer: [0, 15, 1, 15, 0, 15, 1, 15, 2, 15, 3, 15, 2, 15, 3, 15, 4, 15, 5, 15, 4, 15, 5, 15, 6, 15, 7, 15, 6, 15, 7, 15] },
    // Dragon
    { name: "QUOX", file: "QUOX_Dragon", timer: [0, 15, 1, 15, 0, 15, 1, 15, 5, 15, 6, 15, 5, 15, 6, 15, 10, 15, 11, 15, 10, 15, 11, 15, 15, 15, 16, 15, 15, 15, 16, 15] },
    { name: "SLIVER DRAGON", file: "SILVER_Dragon", timer: [0, 15, 1, 15, 0, 15, 1, 15, 5, 15, 6, 15, 5, 15, 6, 15, 10, 15, 11, 15, 10, 15, 11, 15, 15, 15, 16, 15, 15, 15, 16, 15] },
    { name: "BLACK DRAGON", file: "BLACK_Dragon", timer: [0, 15, 1, 15, 0, 15, 1, 15, 5, 15, 6, 15, 5, 15, 6, 15, 10, 15, 11, 15, 10, 15, 11, 15, 15, 15, 16, 15, 15, 15, 16, 15] },
    // Wisp
    { name: "BLUE WILL'O WISP", file: "Wisp", timer: [2, 10, 3, 10] },
    { name: "RED WILL'O WISP", file: "Wisp", timer: [0, 10, 1, 10] },
    // Roper
    { name: "GREEN ROPER", file: "GREEN_Roper", timer: [0, 10, 1, 10] },
    { name: "RED ROPER", file: "RED_Roper", timer: [0, 10, 1, 10] },
    { name: "BLUE ROPER", file: "BLUE_Roper", timer: [0, 10, 1, 10] },
    //
    { name: "SUCCUBUS", file: "Ishtar", timer: [0, 60, 1, 4, 0, 4, 1, 4, 0, 4, 1, 4, 0, 4, 1, 100, 0, 4, 1, 4, 0, 4, 1, 4] },
    { name: "DRUAGA", file: "DemonDruaga", timer: [0, 10, 1, 10] },
    //
    { name: "ISHTAR", file: "Ishtar", timer: [0, 60] },
    { name: "GATE", file: "stage", timer: [0, 60] },
    { name: "OPENED GATE", file: "stage", timer: [1, 60] },
    { name: "KEY", file: "stage", timer: [2, 60] },
    { name: "TREASURE", file: "stage", timer: [3, 60] },

    { name: "KI", file: "Ishtar", timer: [2, 80, 3, 10, 4, 10, 3, 10, 4, 10] },
    // GIL
    { name: "GILGAMETH", file: "", timer: [0, 15, 1, 15, 0, 15, 1, 15, 6, 15, 7, 15, 6, 15, 7, 15, 12, 15, 13, 15, 12, 15, 13, 15, 18, 15, 19, 15, 18, 15, 19, 15] }
];
const itemNameList = [
    "COPPER MATTOCK",
    "SILVER MATTOCK",
    "GOLD MATTOCK",
    "CANDLE",
    "PERMANENT CANDLE",
    "JET BOOTS",
    "BOOK OF LIGHT",
    //
    "WHITE SWORD",
    "DRAGON SLAYER",
    "EXCALIBUR",
    "SAPPHIRE MACE",
    "RUBY MACE",
    "CHIME",
    "BIBLE",
    //
    "GREEN CRYSTAL ROD",
    "RED CRYSTAL ROD",
    "BLUE CRYSTAL ROD",
    "GUANTLET",
    "HYPER GUANTLET",
    "PEARL",
    "BOOK OF GATE DETECT",
    //
    "GREEN RING",
    "RED RING",
    "BLUE RING",
    "ARMOR",
    "HYPER ARMOR",
    "BALANCE",
    "BOOK OF KEY DETECT",
    //
    "GREEN NECKLACE",
    "RED NECKLACE",
    "BLUE NECKLACE",
    "RED LINE SHIELD",
    "BLUE LINE SHIELD",
    "HYPER HELMET",
    "",
    //
    "POTION OF HEALING",
    "POTION OF POWER",
    "POTION OF ENERGY DRAIN",
    "DRAGON POT",
    "POTION OF UNLOCK",
    "POTION OF DEATH",
    "POTION OF CURE",
];

export class AllClearPlay implements IPlay {
    /**
     * モード
     * 0: メッセージ
     */
    private mode = 0;
    private count: number = 240;
    private fontRender: FontRender;
    private stageRender: StageRender;
    private startRender: StartRender;
    private stageTex: WebGLTexture;
    private lookData = [
        [0, 66.1, 59, 300],
        [0, 63, 59, 120],
        [4, 62, 59, 120],
        [8, 58, 59, 400],
        [10, 45, 55, 500],
        [15, 30, 40, 500],
        [15, 2, 30, 400],
        [15, 2, 15, 400],
        [20, 2, 0, 400],
        [15, 1, 0, 500]
    ];
    private castIndex = 0;
    private castData: {
        data: CastData;
        x: number;
        y: number;
        time: number;
        index: number;
    }[] = [];
    private itemIndex = 0;
    private scrollY = 0;

    public constructor(gl: WebGL2RenderingContext, private stage: StageData) {
        this.fontRender = getFontRender(gl);
        this.stageRender = getStageRender(gl);
        this.startRender = getStartRender(gl);
        this.stageTex = this.startRender.makeStageTexture(gl, this.stageRender, this.stage, false);
        this.count = this.lookData[0][3];
        this.stage.playerData.init(gl, 0, 0);
    }
    stepFrame(gl: WebGL2RenderingContext, stick: StickData): IPlay {
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0);
        gl.viewport(0, 0, 512, 512);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        let ix = Math.min(this.mode, this.lookData.length - 1);
        let length = this.lookData[ix][0];
        let near = this.lookData[ix][1];
        let look = this.lookData[ix][2];
        let time = this.lookData[ix][3];
        if (ix < this.lookData.length - 1) {
            length += (this.lookData[ix + 1][0] - length) * (time - this.count) / time;
            near += (this.lookData[ix + 1][1] - near) * (time - this.count) / time;
            look += (this.lookData[ix + 1][2] - look) * (time - this.count) / time;
        }
        this.startRender.draw(gl, length, near, look, this.stageTex, this.mode === this.lookData.length - 1);
        let col = [1, 0.5 + Math.sin(this.count / 10 * Math.PI) * 0.5, 0.5 + Math.cos(this.count / 20 * Math.PI) * 0.5];
        if (this.mode < 5) {
            let y = this.scrollY - 0.6;
            gl.clear(gl.DEPTH_BUFFER_BIT);
            for (let msg of clearMessge) {
                if (msg.length > 0) {
                    this.fontRender.draw(gl, msg, [-msg.length * 0.025, y, msg.length * 0.05, 0.08], col);
                    y += 0.1;
                } else {
                    y += 0.5;
                    if (y > this.scrollY + 1) {
                        col = [1, 1, 1];
                    } else {
                        col = [0.7, 0.7, 1];
                    }
                }
            }
            if (this.mode >= 2) {
                this.scrollY -= 0.005;
            }
        }
        if (this.mode >= 3) {
            let lasty = 0;
            for (let c of this.castData) {
                c.y -= 0.005;
                lasty = c.y;
                gl.viewport(0, 0, 512, 512);
                let sprite: SpriteData;
                if (c.data.file) {
                    sprite = this.stage.getSprite(gl, c.data.file);
                } else {
                    sprite = this.stage.playerData.spriteData;
                }
                this.fontRender.draw(gl, c.data.name, [c.x - c.data.name.length * 0.015, c.y - 0.04, c.data.name.length * 0.03, 0.05], [1, 1, 1]);
                if (c.data.timer[c.index] >= 0) {
                    this.stageRender.drawChara(gl, sprite, c.x - 0.075, c.y, c.data.timer[c.index]);
                }
                c.time--;
                if (c.time <= 0) {
                    c.index = (c.index + 2) % c.data.timer.length;
                    c.time = c.data.timer[c.index + 1];
                }
            }
            if (lasty < 0.9) {
                if (this.castIndex < castDataList.length) {
                    // 追加
                    this.castData.push({
                        data: castDataList[this.castIndex],
                        x: 0.6,
                        y: 1.15,
                        time: castDataList[this.castIndex].timer[1],
                        index: 0
                    });
                    this.castIndex++;
                }
                while (this.itemIndex < itemNameList.length) {
                    // アイテムも追加
                    if (itemNameList[this.itemIndex]) {
                        this.castData.push({
                            data: {
                                name: itemNameList[this.itemIndex],
                                file: 'item',
                                timer: [this.itemIndex, 1000],
                            },
                            x: -0.6,
                            y: 1.15,
                            time: 1000,
                            index: 0
                        });
                        this.itemIndex++;
                        break;
                    } else {
                        this.itemIndex++;
                    }
                }
            }
            if (this.castData.length > 0 && this.castData[0].y < -1.1) {
                this.castData.shift();
            }
        }
        this.count--;
        if (this.count <= 0) {
            this.mode++;
            this.count = 240;
            if (this.mode < this.lookData.length) {
                this.count = this.lookData[this.mode][3];
            } else {
                gl.deleteTexture(this.stageTex);
                return new TitlePlay(gl);
            }
        } else if (this.mode === this.lookData.length - 1) {
            this.stageRender.drawChara(gl, this.stage.playerData.spriteData, 0.04, -0.05, 12);
            this.stageRender.drawChara(gl, this.stage.getSprite(gl, "Ishtar"), -0.06, -0.05, 2);
            if (this.count < 300) {
                gl.viewport(0, 0, 512, 512);
                this.fontRender.draw(gl, "THANK YOU FOR YOUR PLAYING.", [-0.8, 0.3, 1.6, 0.12], [1, 1, 0.8]);
            }
        }
        return this;
    }
}