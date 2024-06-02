import { FontRender, getFontRender } from "./FontRender";
import { IPlay, SaveData, StickData, saveData } from "./PlayData";
import { ARMOR_ITEM, BOOK_ITEM, BOOTS_ITEM, GUNTLET_ITEM, HELMET_ITEM, MEITH_ITEM, NECKLACE_ITEM, PEARL_ITEM, PlayerData, RING_ITEM, ROD_ITEM, SHIELD_ITEM, SWORD_ITEM } from "./StageData";
import { } from "./Enemy";
import { } from "./TreasureEvent";
import { } from "./FloorInit";
import { FloorSelect } from "./FloorSelect";
import { FloorStart, setSkyName } from "./FloorStart";
import { preloadImages } from "./SpriteData";
import { playBgm } from "./SoundData";
import { getStageRender } from "./StagePlay";

const v_shader = `
// xyz, a=色の明るさ
attribute vec4 a_pos;

varying vec2 v_tex;

void main() {
    gl_Position = vec4(a_pos.xy, 0, 1);
    v_tex = a_pos.zw;
}
`;

const f_shader = `
precision mediump float;
uniform sampler2D u_tex;

varying vec2 v_tex;

void main() {
    gl_FragColor = texture2D(u_tex, v_tex);
}
`;

const titleMessage = `   IN ANOTHER TIME
      IN ANOTHER WORLD...

THE BLUE CRYSTAL ROD
   KEPT THE KINGDOM IN PEACE

BUT THE EVIL DEMON DRUAGA
   HID THE ROD
      AND THE MAIDEN KI
         IN A TOWER

THE PRINCE GILGAMESH
  WORE GOLDEN ARMOR
    AND ATTACKED MONSTERS
      TO HELP KI IN
        THE TOWER OF DRUAGA`;

const gameTypeName = ["DATA", "ANOTHER", "SHADDOW", "DARK"];

let lastGameType = 0;

class DebugTest {
    private mode = 0;
    private lastStick = 0;
    private mode0Count = 0;

    public checkStick(stick: StickData): void {
        if (this.mode === 1) {
            if (stick.isRight() && stick.isPause()) {
                this.mode = 2;
            }
        } else if (this.mode === 0) {
            let stk = 0;
            (stick.isUp() && (stk |= 1));
            (stick.isRight() && (stk |= 2));
            (stick.isDown() && (stk |= 4));
            (stick.isLeft() && (stk |= 8));
            if (stk === this.lastStick) {
                return;
            }
            const command = [
                1, 0, 4, 0, 8, 0, 2, 0,
                4, 0, 1, 0, 2, 0, 8, 0,
                8, 0, 2, 0, 4, 0, 1, 0,
                2, 0, 8, 0, 1, 0
            ];
            if (stk === command[this.mode0Count]) {
                this.mode0Count++;
                if (this.mode0Count >= command.length) {
                    console.log("SECRET COMMAND OK!");
                    this.mode = 1;
                }
            } else {
                this.mode0Count = 0;
            }
            this.lastStick = stk;
        }
    }
    public checkStart(saveNum: number): boolean {
        if (this.mode === 1) {
            // 特殊
            saveData.getSaveData(saveNum).then(data => {
                data.data.evilMap = {};
                data.data.maxStage = 60;
                data.data.continueFlag = true;
                data.data.itemMap = Object.assign({}, data.data.itemMap, {
                    [SWORD_ITEM]: 3,
                    [ARMOR_ITEM]: 2,
                    [SHIELD_ITEM]: 2,
                    [GUNTLET_ITEM]: 2,
                    [BOOTS_ITEM]: 1,
                    [HELMET_ITEM]: 1,
                    [NECKLACE_ITEM]: 3,
                    [RING_ITEM]: 3,
                    [ROD_ITEM]: 7,
                    [BOOK_ITEM]: 4,
                    [MEITH_ITEM]: 2,
                    [PEARL_ITEM]: 1
                });
                saveData.updateSaveData(data).then();
            });
            return true;
        } else {
            return false;
        }
    }
}

export class TitlePlay implements IPlay {
    private fontRender: FontRender;
    private message: string[];
    private program: WebGLProgram;
    private aPos: number;
    private uTex: WebGLUniformLocation;
    private posVbo: WebGLBuffer;
    private texture: WebGLTexture;
    private count = 0;
    private select = 0;
    private saveData: SaveData[] = [];
    private mode: number[] = [];
    private gameType: number = lastGameType;
    private startWait = 0;
    private debugText?: DebugTest;

    public constructor(gl: WebGL2RenderingContext) {
        this.fontRender = getFontRender(gl);
        this.message = titleMessage.split('\n');
        let vs = gl.createShader(gl.VERTEX_SHADER)!;
        gl.shaderSource(vs, v_shader);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
            console.log(gl.getShaderInfoLog(vs));
        }
        let fs = gl.createShader(gl.FRAGMENT_SHADER)!;
        gl.shaderSource(fs, f_shader);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
            console.log(gl.getShaderInfoLog(fs));
        }
        this.program = gl.createProgram()!;
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);
        //
        gl.useProgram(this.program);
        this.aPos = gl.getAttribLocation(this.program, "a_pos");
        this.uTex = gl.getUniformLocation(this.program, "u_tex")!;
        //
        this.posVbo = gl.createBuffer()!;
        this.texture = gl.createTexture()!;

        let img = new Image();
        img.onload = () => {
            console.log("Image Loaded");
            gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
            gl.generateMipmap(gl.TEXTURE_2D);
            gl.bindTexture(gl.TEXTURE_2D, null);
        };
        // 176x145
        img.src = `images/title.png`;
        this.loadData().then();
        // preload
        getStageRender(gl);
        // TODO Debug
        this.debugText = new DebugTest();
    }
    private async loadData(): Promise<void> {
        this.mode = [];
        this.saveData = [];
        for (let i = 0; i < 5; i++) {
            const dt = await saveData.getSaveData(this.gameType * 5 + i);
            this.saveData.push(dt);
            if (dt.data.maxStage === 1 && Object.keys(dt.data.itemMap).length === 0) {
                // 初期
                this.mode.push(0);
            } else {
                this.mode.push(3);
            }
        }
        preloadImages();
    }
    private close(gl: WebGL2RenderingContext): void {
        gl.deleteBuffer(this.posVbo);
        gl.deleteTexture(this.texture);
        gl.deleteProgram(this.program);
    }
    stepFrame(gl: WebGL2RenderingContext, stick: StickData): IPlay {
        if (this.debugText) {
            this.debugText.checkStick(stick);
        }
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0);
        gl.viewport(0, 0, 512, 512);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        const tx = -0.9;
        const ty = 0.9;
        let sz = 1;
        this.count++;
        if (this.count > 300) {
            sz = Math.max(0.5, 1 - (this.count - 300) / 200);
        } else {
            this.fontRender.draw(gl, "CLASSIC GAME SERIES", [-0.5, 0.7, 1, 0.1], [1, 1, 1, 1]);
        }
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            tx, ty, 0, 0,
            tx, ty - 1.45 * sz, 0, 1,
            tx + 1.76 * sz, ty, 1, 0,
            tx + 1.76 * sz, ty - 1.45 * sz, 1, 1
        ]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 4, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.uTex, 0);

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        if (this.count > 400) {
            let col = [0.6, 0.9, 0.6];
            let y = -0.12;
            let num = Math.ceil((this.count - 400) / 2);
            for (let i = 0; i < this.message.length && num > 0; i++) {
                if (i === this.message.length - 1) {
                    col = [1, 0.7, 0.7];
                    col = [1, 0.2, 0];
                }
                let msg = this.message[i];
                if (msg.length > 0) {
                    if (msg.length > num) {
                        msg = msg.substring(0, num);
                    }
                    num -= msg.length;
                    this.fontRender.draw(gl, msg, [tx, y, msg.length * 0.035, 0.05], col);
                    y += 0.07;
                } else {
                    y += 0.05;
                }
            }
            let typeCol = [1, 1, 1];
            switch (this.gameType) {
                case 1:
                    typeCol = [0.2, 0.8, 0.2];
                    break;
                case 2:
                    typeCol = [0.4, 0.5, 1];
                    break;
                case 3:
                    typeCol = [0.8, 0.3, 0.4];
                    break;
            }
            for (let i = 0; i < this.saveData.length; i++) {
                const fx = 0.1;
                const fy = 0.35 * i - 0.9;
                if (this.select === i) {
                    if (this.startWait > 0 && (this.startWait & 8)) {
                        continue;
                    }
                    this.fontRender.drawFrame(gl, [fx, fy, 0.8, 0.3], [0.3, 0.2, 0], [0.7, 1, 1]);
                }
                let type = gameTypeName[this.gameType] + " " + (i + 1);
                this.fontRender.draw(gl, type, [fx + 0.05, fy + 0.05, type.length * 0.05, 0.06], typeCol);
                if (this.mode[i] & 1) {
                    let stg = "< FLOOR " + this.saveData[i].data.curStage + "/" + this.saveData[i].data.maxStage;
                    if (this.saveData[i].data.continueFlag) {
                        stg += ".";
                    }
                    this.fontRender.draw(gl, stg, [fx + 0.1, fy + 0.15, stg.length * 0.05, 0.06], [1, 1, 0.2]);
                    let contNum = (this.saveData[i].data.continueCount || 0).toString();
                    this.fontRender.draw(gl, contNum, [fx + 0.6, fy + 0.23, contNum.length * 0.04, 0.04], [1, 1, 0.2]);
                } else {
                    let stg = "START";
                    if (this.mode[i] & 2) {
                        stg += " >";
                    }
                    this.fontRender.draw(gl, stg, [fx + 0.1, fy + 0.15, stg.length * 0.05, 0.06], [1, 0.4, 0.4]);
                }
            }
            if (this.startWait === 0) {
                if (stick.isUp(true) && this.select > 0) {
                    this.select--;
                } else if (stick.isDown(true) && this.select < 4) {
                    this.select++;
                } else if (stick.isLeft(true)) {
                    this.mode[this.select] &= ~1;
                } else if (stick.isRight(true)) {
                    this.mode[this.select] |= (this.mode[this.select] >> 1);
                } else if (stick.isSelect(true)) {
                    this.gameType = (this.gameType + 1) % 4;
                    this.loadData().then();
                }
            }
        } else if (stick.isPause(true) || stick.isUp(true) || stick.isDown(true) || stick.isLeft(true) || stick.isRight(true) || stick.isSelect(true)) {
            this.count = 400;
        }
        if (this.startWait > 0) {
            // 開始待ち
            this.startWait--;
            if (this.startWait === 0) {
                let playerData: PlayerData;
                const ix = this.gameType * 5 + this.select;
                playerData = new PlayerData(gl, stick, ix);
                this.close(gl);
                setSkyName(["sky", "sky2", "sky3", "sky4"][this.gameType]);
                if (this.mode[this.select] & 1) {
                    return new FloorSelect(gl, playerData);
                } else {
                    return new FloorStart(gl, playerData, 1, true);
                }
            }
        }
        if (stick.isPause(true)) {
            playBgm('Coin', 1).then();
            this.startWait = 180;
            lastGameType = this.gameType;
            if (this.debugText) {
                if (this.debugText.checkStart(this.gameType * 5 + this.select)) {
                    this.mode[this.select] |= 1;
                }
            }
        }
        return this;
    }
}