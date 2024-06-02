import { AllClearPlay } from "./AllClearPlay";
import { Dragon, Saccubus } from "./Enemy";
import { FloorStart } from "./FloorStart";
import { FontRender, getFontRender } from "./FontRender";
import { GameOverPlay } from "./GameOverPlay";
import { IPlay, StickData } from "./PlayData";
import { playBgm } from "./SoundData";
import { PlayerSpriteData, SpriteData } from "./SpriteData";
import { BLOCK_SIZE, DragonFire, KEY_ITEM, PlayMode, STAGE_DARK, STAGE_FILE_NAME, STAGE_HIDDEN_DOOR, STAGE_HIDDEN_KEY, StageData } from "./StageData";
import { ZapPlay } from "./ZapPlay";

const v_shader = `
// xyz, a=角度
attribute vec4 a_pos;
attribute vec4 a_color;

// xyz: offset, w: z-offset
uniform vec4 u_blk;
// xy: light xy, z: hor_x
uniform vec3 u_pos;
// x:length, y:min, z:max
uniform vec3 u_light;
varying vec4 v_color;
varying vec2 v_center;
varying vec2 v_block;
varying vec3 v_light;

void main() {
    vec2 blk = u_blk.xy + a_pos.xy;
    vec2 dir = normalize(blk.xy - u_pos.xy);
    vec2 dir2;
    float light;
    v_light = u_light;
    if (a_pos.w < 0.0) {
        light = -a_pos.w;
    } else {
        dir2 = vec2(-cos(a_pos.w), sin(a_pos.w));
        light = clamp((1.0 - dot(dir, dir2) / 5.0), 0.5, 1.2);
    }
    float z = a_pos.z + u_blk.z;
    gl_Position = vec4((blk.x - u_pos.z) / 7.0, 0.85 - blk.y / 7.0 + z / 12.0, 0.5 - z / 20.0 + u_blk.w, 1.0 - blk.y / 20.0);
    if (a_color.b < 0.0) {
        v_color = vec4(a_color.xy, light - 2.0, a_color.a);
    } else {
        v_color = vec4(a_color.rgb * light, a_color.a);
    }
    v_block = blk;
    v_center = u_pos.xy;
}
`;

const f_shader = `
precision mediump float;
varying vec4 v_color;
varying vec2 v_center;
varying vec2 v_block;
varying vec3 v_light;
uniform sampler2D u_tex;

void main() {
    float light;
    if (v_center.x < 0.0) {
        light = 1.0;
    } else {
        light = clamp(1.0 - length(v_block - v_center) / v_light.x, v_light.y, v_light.z);
    }
    if (v_color.b < 0.0) {
        vec4 col = texture2D(u_tex, v_color.xy);
        gl_FragColor = vec4(col.rgb * (v_color.b + 2.0) * light, v_color.a * col.a);
        //gl_FragColor = vec4(col.rgb * light, v_color.a * col.a);
    } else {
        gl_FragColor = vec4(v_color.rgb * light, v_color.a);
    }
}
`;

/**
 * スプライト描画用
 */
interface SpriteDraw {
    sprite: WebGLTexture;
    x: number;
    y: number;
    rect: { sx: number; sy: number; ex: number; ey: number; };
    zadd?: number;// = -0.01
}

export class StageRender {
    private program: WebGLProgram;
    private aPos: number;
    private aColor: number;
    private posVbo: WebGLBuffer;
    private colorVbo: WebGLBuffer;
    private spriteVbo: WebGLBuffer;
    private spriteTexVbo: WebGLBuffer;
    private fireVbo: WebGLBuffer;
    private fireTexVbo: WebGLBuffer;
    private uPos: WebGLUniformLocation;
    private uBlk: WebGLUniformLocation;
    private uTex: WebGLUniformLocation;
    private uLight: WebGLUniformLocation;
    private texMap: { [key: string]: WebGLTexture } = {};

    public constructor(gl: WebGL2RenderingContext) {
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
        this.aColor = gl.getAttribLocation(this.program, "a_color");
        this.uPos = gl.getUniformLocation(this.program, "u_pos")!;
        this.uBlk = gl.getUniformLocation(this.program, "u_blk")!;
        this.uTex = gl.getUniformLocation(this.program, "u_tex")!;
        this.uLight = gl.getUniformLocation(this.program, "u_light")!;

        // buffer
        this.posVbo = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posVbo);
        let pos: number[] = [];
        let col: number[] = [];
        // 床
        pos.push(0, 0, 0, -1, 0, 9, 0, -1, 18, 0, 0, -1, 18, 9, 0, 1);
        col.push(0, 0, -1, 1, 0, 9, -1, 1, 18, 0, -1, 1, 18, 9, -1, 1);
        const tx1 = 0.1;
        const ty1 = 0.07;
        // 柱
        pos.push(
            // 左
            -tx1, -ty1, 0, 0,
            -tx1, ty1, 0, 0,
            -tx1, -ty1, 1, 0,
            -tx1, ty1, 1, 0,
            // 正面
            -tx1, ty1, 1, Math.PI / 2,
            -tx1, ty1, 0, Math.PI / 2,
            tx1, ty1, 1, Math.PI / 2,
            tx1, ty1, 0, Math.PI / 2,
            // 右
            tx1, ty1, 0, Math.PI,
            tx1, -ty1, 0, Math.PI,
            tx1, ty1, 1, Math.PI,
            tx1, -ty1, 1, Math.PI,
            // 上
            tx1, -ty1, 1, -1,
            -tx1, -ty1, 1, -1,
            tx1, ty1, 1, -1,
            -tx1, ty1, 1, -1
        );
        col.push(
            // 左
            0, 1, -1, 1,
            ty1 * 2, 1, -1, 1,
            0, 0.25, -1, 1,
            ty1 * 2, 0.25, -1, 1,
            // 正面
            0, 0.25, -1, 1,
            0, 1, -1, 1,
            tx1 * 2, 0.25, -1, 1,
            tx1 * 2, 1, -1, 1,
            // 右
            0, 1, -1, 1,
            ty1 * 2, 1, -1, 1,
            0, 0.25, -1, 1,
            ty1 * 2, 0.25, -1, 1,
            // 上
            0, 0, -1, 1,
            0, 0.25, -1, 1,
            tx1 * 2, 0, -1, 1,
            tx1 * 2, 0.25, -1, 1
        );
        // 水平の壁
        pos.push(
            1 - tx1, -ty1, 1, -1,
            tx1, -ty1, 1, -1,
            1 - tx1, ty1, 1, -1,
            tx1, ty1, 1, -1,
            tx1, ty1, 1, Math.PI / 2,
            tx1, ty1, 0, Math.PI / 2,
            1 - tx1, ty1, 1, Math.PI / 2,
            1 - tx1, ty1, 0, Math.PI / 2
        );
        col.push(
            1, 0, -1, 1,
            tx1 * 2, 0, -1, 1,
            1, 0.25, -1, 1,
            tx1 * 2, 0.25, -1, 1,
            tx1 * 2, 0.25, -1, 1,
            tx1 * 2, 1, -1, 1,
            1, 0.25, -1, 1,
            1, 1, -1, 1
        );
        // 垂直の壁
        pos.push(
            // 左
            -tx1, ty1, 0, 0,
            -tx1, 1 - ty1, 0, 0,
            -tx1, ty1, 1, 0,
            -tx1, 1 - ty1, 1, 0,
            // 上
            -tx1, ty1, 1, -1,
            -tx1, 1 - ty1, 1, -1,
            tx1, ty1, 1, -1,
            tx1, 1 - ty1, 1, -1,
            // 右
            tx1, 1 - ty1, 1, Math.PI,
            tx1, 1 - ty1, 0, Math.PI,
            tx1, ty1, 1, Math.PI,
            tx1, ty1, 0, Math.PI
        );
        col.push(
            ty1 * 2, 1, -1, 1,
            1, 1, -1, 1,
            ty1 * 2, 0.25, -1, 1,
            1, 0.25, -1, 1,
            ty1 * 2, 0.25, -1, 1,
            1, 0.25, -1, 1,
            ty1 * 2, 0, -1, 1,
            1, 0, -1, 1,
            ty1 * 2, 0.25, -1, 1,
            ty1 * 2, 1, -1, 1,
            1, 0.25, -1, 1,
            1, 1, -1, 1
        );
        // 外壁
        pos.push(
            // 左
            tx1, 9, 0, Math.PI,
            tx1, 0, 0, Math.PI,
            tx1, 9, 1.2, Math.PI,
            tx1, 0, 1.2, Math.PI,
            -5, 9, 1.2, -1,
            -5, 0, 1.2, -1,
            // 上
            -4, ty1, 0, Math.PI / 2,
            22, ty1, 0, Math.PI / 2,
            -4, ty1, 1.2, Math.PI / 2,
            22, ty1, 1.2, Math.PI / 2,
            -4, -2, 1.2, -1,
            22, -2, 1.2, -1,
            // 右
            18 - tx1, 0, 0, 0,
            18 - tx1, 9, 0, 0,
            18 - tx1, 0, 1.2, 0,
            18 - tx1, 9, 1.2, 0,
            22, 0, 1.2, -1,
            22, 9, 1.2, -1,
            // 下
            22, 10, 1.2, -1,
            22, 9, 1.2, -1,
            -4, 10, 1.2, -1,
            -4, 9, 1.2, -1
        );
        col.push(
            // 左
            0.1, 1, -1, 1,
            9.1, 1, -1, 1,
            0.1, 0.5, -1, 1,
            9.1, 0.5, -1, 1,
            0.1, 0, -1, 1,
            9.1, 0, -1, 1,
            // 上
            0.5, 1, -1, 1,
            26.5, 1, -1, 1,
            0.5, 0.5, -1, 1,
            26.5, 0.5, -1, 1,
            0.5, 0, -1, 1,
            26.5, 0, -1, 1,
            // 右
            0.1, 1, -1, 1,
            9.1, 1, -1, 1,
            0.1, 0.5, -1, 1,
            9.1, 0.5, -1, 1,
            0.1, 0, -1, 1,
            9.1, 0, -1, 1,
            // 下
            0.5, 0, -1, 1,
            0.5, 0.52, -1, 1,
            26.5, 0, -1, 1,
            26.5, 0.52, -1, 1
        );
        // Chime
        pos.push(
            // 左
            0.3, 0, 1.1, -1,
            0.3, 0.4, 1.1, -1,
            0.7, 0, 1.1, -1,
            0.7, 0.4, 1.1, -1,
            // 右
            0.3, 0, 1.1, -1,
            0.3, 0.4, 1.1, -1,
            0.7, 0, 1.1, -1,
            0.7, 0.4, 1.1, -1,
        );
        let sx = 5 / 7.0;
        let ex = 6 / 7.0;
        let sy = 1 / 7.0;
        let ey = 2 / 7.0;
        col.push(
            // 左
            sx, sy, -1, 1,
            sx, ey, -1, 1,
            ex, sy, -1, 1,
            ex, ey, -1, 1,
            // 右
            ex, sy, -1, 1,
            ex, ey, -1, 1,
            sx, sy, -1, 1,
            sx, ey, -1, 1
        );

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
        this.colorVbo = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(col), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.spriteVbo = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteVbo);
        //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0.15, 0.6, 1.0, -1, 0.15, 0.6, 0, -1, 0.85, 0.6, 1.0, -1, 0.85, 0.6, 0, -1]), gl.STATIC_DRAW);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0.1, 0.5, 1.2, -1,
            0.1, 0.5, 0, -1,
            0.9, 0.5, 1.2, -1,
            0.9, 0.5, 0, -1
        ]), gl.STATIC_DRAW);
        this.spriteTexVbo = gl.createBuffer()!;
        this.fireVbo = gl.createBuffer()!;
        this.fireTexVbo = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fireTexVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            0, 0, -1, 1,
            0, 0.25, -1, 1,
            0.5, 0, -1, 1,
            0.5, 0.25, -1, 1,
            0, 0.25, -1, 1,
            0, 0.5, -1, 1,
            0.5, 0.25, -1, 1,
            0.5, 0.5, -1, 1,
            0, 0.5, -1, 1,
            0, 0.75, -1, 1,
            0.5, 0.5, -1, 1,
            0.5, 0.75, -1, 1,
            0, 0.75, -1, 1,
            0, 1, -1, 1,
            0.5, 0.75, -1, 1,
            0.5, 1, -1, 1,
        ]), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // Texture
        const imgList = ["floor", "wall", "block", "ground", "sky", "sky2", "sky3", "sky4"];
        for (let name of imgList) {
            this.getTexture(gl, name);
        }
    }
    public getTexture(gl: WebGL2RenderingContext, name: string): WebGLTexture {
        if (!(name in this.texMap)) {
            const tex = gl.createTexture()!;
            this.texMap[name] = tex;
            let img = new Image();
            img.onload = () => {
                console.log("Image Loaded", name);
                gl.bindTexture(gl.TEXTURE_2D, tex);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
                gl.generateMipmap(gl.TEXTURE_2D);
                gl.bindTexture(gl.TEXTURE_2D, null);
            };
            img.src = `images/${name}.png`;
        }
        return this.texMap[name];
    }

    public draw(gl: WebGL2RenderingContext, stage: StageData, startDraw = false): void {
        gl.useProgram(this.program);
        gl.viewport(0, 50, 512, 462);
        gl.enable(gl.CULL_FACE);
        gl.enable(gl.BLEND);
        gl.enable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        if (stage.isStageFlag(STAGE_DARK)) {
            gl.uniform3f(this.uLight, 0.1, 0, 1.2);
        } else {
            gl.uniform3f(this.uLight, 10, 0.2, 1.2);
        }

        const pos = stage.playerData.getDrawData();
        let viewX = pos.x;
        if (viewX < 4) {
            viewX = 4;
        } else if (viewX > 14) {
            viewX = 14;
        }

        let sprlst: SpriteDraw[] = [
        ];
        // 扉と鍵
        const stgitem = stage.getSprite(gl, STAGE_FILE_NAME);
        if (stage.isDoorOpen()) {
            const pos = stage.getDoorPos();
            sprlst.push({
                sprite: stgitem.texData,
                x: pos.x,
                y: pos.y - 0.3,
                rect: stgitem.getTexRect(1)
            });
        } else {
            if (!stage.isStageFlag(STAGE_HIDDEN_DOOR)) {
                const pos = stage.getDoorPos();
                sprlst.push({
                    sprite: stgitem.texData,
                    x: pos.x,
                    y: pos.y - 0.3,
                    rect: stgitem.getTexRect(0)
                });
            }
            if (!stage.isStageFlag(STAGE_HIDDEN_KEY) && stage.playerData.getItem(KEY_ITEM) < 0) {
                // 鍵をとっていない
                const keypos = stage.getKeyPos();
                sprlst.push({
                    sprite: stgitem.texData,
                    x: keypos.x,
                    y: keypos.y - 0.1,
                    rect: stgitem.getTexRect(2),
                    zadd: 0
                });
            }
        }
        if (stage.getTreasure() > 0) {
            // 宝が出ている
            const pos = stage.getTreasurePos();
            sprlst.push({
                sprite: stgitem.texData,
                x: pos.x,
                y: pos.y,
                rect: stgitem.getTexRect(3)
            });
        }

        // 敵
        for (let ene of stage.getEnemyList()) {
            const pos = ene.getSpritePosition();
            if (pos) {
                sprlst.push({
                    sprite: ene.spriteData.texData,
                    x: pos.x,
                    y: pos.y,
                    rect: ene.spriteData.getTexRect(pos.index)
                })
            }
        }
        gl.uniform3f(this.uPos, pos.x + 0.4, pos.y + 0.4, viewX);
        // ギル
        let visible = true;
        switch (stage.getPlayMode()) {
            case PlayMode.StarWait:
                visible = (stage.getGlobalCount() & 2) > 0;
                break;
            case PlayMode.ZapWait:
            case PlayMode.LostWait:
                {
                    const cnt = stage.getGlobalCount();
                    let mask = 255;
                    if (cnt < 60) {
                        mask = 2;
                    } else if (cnt < 120) {
                        mask = 4;
                    } else if (cnt < 180) {
                        mask = 6;
                    } else if (cnt < 240) {
                        mask = 7;
                    }
                    visible = (cnt & mask) > 0;
                }
                break;
            case PlayMode.ClearWait:
                pos.y += Math.min(0, stage.getGlobalCount() / 300.0 - 0.25);
                if (pos.y < -0.2) {
                    visible = false;
                }
                break;
        }
        if (visible) {
            sprlst.push(
                {
                    sprite: stage.playerData.spriteData.texData,
                    x: pos.x,
                    y: pos.y,
                    rect: stage.playerData.spriteData.getTexRect(pos.foot)
                },
                {
                    sprite: stage.playerData.spriteData.bodyTex,
                    x: pos.x,
                    y: pos.y,
                    rect: stage.playerData.spriteData.getBodyTexRect(pos.body)
                }
            );
        }

        sprlst.sort((a, b) => {
            if (a.y < b.y) {
                return -1;
            } else if (a.y > b.y) {
                return 1;
            }
            return 0;
        });

        gl.enable(gl.DEPTH_TEST);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.posVbo);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.colorVbo);
        gl.enableVertexAttribArray(this.aColor);
        gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        gl.uniform3f(this.uPos, -1, -1, viewX);

        // 外壁
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texMap['block']);
        gl.uniform1i(this.uTex, 0);
        gl.uniform4f(this.uBlk, 0, 0, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 40, 22);
        // 床
        gl.uniform3f(this.uPos, pos.x + 0.4, pos.y + 0.4, viewX);
        gl.bindTexture(gl.TEXTURE_2D, this.texMap['floor']);
        gl.uniform4f(this.uBlk, 0, 0, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        // 柱
        gl.bindTexture(gl.TEXTURE_2D, this.texMap['wall']);
        for (let y = 1; y < 9; y++) {
            for (let x = 1; x < 18; x++) {
                gl.uniform4f(this.uBlk, x, y, 0, 0);
                gl.drawArrays(gl.TRIANGLE_STRIP, 4, 16);
            }
        }
        // 壁
        for (let dt of stage.getWall()) {
            gl.uniform4f(this.uBlk, dt.x, dt.y, 0, 0);
            if (dt.type === 1) {
                gl.drawArrays(gl.TRIANGLE_STRIP, 28, 12);
            } else if (dt.type === 2) {
                gl.drawArrays(gl.TRIANGLE_STRIP, 20, 8);
            }
        }
        if (startDraw) {
            return;
        }
        //gl.bindTexture(gl.TEXTURE_2D, this.texMap['gil']);

        gl.uniform3f(this.uPos, -1, -1, viewX);

        const itemimg = stage.getSprite(gl, "item");
        // Chime
        const chime = stage.playerData.getChimePos();
        if (chime) {
            gl.uniform4f(this.uBlk, pos.x + (chime > 0 ? 0.5 : -0.5), pos.y, 0, 0);
            gl.bindTexture(gl.TEXTURE_2D, itemimg.texData);
            gl.drawArrays(gl.TRIANGLE_STRIP, 62 + (chime & 1) * 4, 4);
        }

        // Fire
        const fireimg = stage.getSprite(gl, "DragonFire");
        gl.bindTexture(gl.TEXTURE_2D, fireimg.texData);
        for (let fire of stage.getFireList()) {
            this.drawFire(gl, fire);
        }

        let lastx = -1;
        let lasty = -1;
        let subz = 0;
        for (let spr of sprlst) {
            let zadd = 0;
            if (lasty === spr.y) {
                // 重なるかもしれない
                if (Math.abs(lastx - spr.x) <= 1.1) {
                    zadd -= subz;
                    subz += 0.005;
                } else {
                    subz = 0.005;
                }
            } else {
                subz = 0.005;
            }
            this.drawSprite(gl, spr.sprite, spr.x, spr.y, spr.rect, zadd)
            lastx = spr.x;
            lasty = spr.y;
        }

        const flash = stage.getFlash();
        if (flash) {
            this.drawFlash(gl, pos.x, pos.y, flash.count, flash.type);
        }

        gl.viewport(0, -382, 512, 462);
        const itemix = stage.playerData.getDrawItemList();
        gl.uniform3f(this.uPos, -1, -1, 6.5);
        // 残りプレイヤー
        for (let i = 0; i < stage.playerData.getRest(); i++) {
            this.drawSprite(gl, stgitem.texData, i * 0.3, 0.95, stgitem.getTexRect(4), -i * 0.01);
        }
        for (let i = 0; i < itemix.length; i++) {
            const ix = itemix[i];
            if (ix < 0) {
                continue;
            }
            let x = i * 0.8;
            let y = 0;
            if (i > 11) {
                x = (i - 10) * 0.8;
                y = 0.95;
            }
            this.drawSprite(gl, itemimg.texData, x, y, itemimg.getTexRect(ix));
        }
        stage.playerData.getHP();
    }

    private drawFire(gl: WebGL2RenderingContext, data: DragonFire): void {
        let pos: number[] = [];
        let lendata = [data.length];
        if (data.dir & 1) {
            // 縦
            if (lendata[0] > 1.4) {
                lendata.push((lendata[0] - 1.4) * 2.6 / 3.6 + 1.4);
                if (lendata[1] > 1.5) {
                    lendata.push((lendata[1] - 1.5) * 1.5 / 3.5 + 1.5);
                    if (lendata[2] > 1.6) {
                        lendata.push((lendata[2] - 1.6) * 0.4 / 3.4 + 1.6);
                    }
                }
            }
        } else {
            // 横
            if (lendata[0] > 1.4) {
                lendata.push((lendata[0] - 1.4) * 2.9 / 3.6 + 1.4);
                if (lendata[1] > 1.5) {
                    lendata.push((lendata[1] - 1.5) * 2.1 / 3.5 + 1.5);
                    if (lendata[2] > 1.6) {
                        lendata.push((lendata[2] - 1.6) * 1.3 / 3.4 + 1.6);
                    }
                }
            }
        }
        let sx = 0.2 + data.bx;
        let sy = 0.2 + data.by;
        let adds = [0.6, 0];
        let addl = [0, -1];
        switch (data.dir) {
            case 2:
                sx = data.bx + 0.8;
                sy = data.by + 0.2;
                adds = [0, 0.6];
                addl = [1, 0];
                break;
            case 3:
                sx = data.bx + 0.8;
                sy = data.by + 0.8;
                adds = [-0.6, 0];
                addl = [0, 1];
                break;
            case 4:
                sx = data.bx + 0.2;
                sy = data.by + 0.8;
                adds = [0, -0.6];
                addl = [-1, 0];
                break;
        }
        for (let len of lendata) {
            let st = Math.max(0, len - 3);
            pos.push(sx + addl[0] * st, sy + addl[1] * st, 0.5, -1);
            pos.push(sx + addl[0] * st + adds[0], sy + addl[1] * st + adds[1], 0.5, -1);
            pos.push(sx + addl[0] * len, sy + addl[1] * len, 0.5, -1);
            pos.push(sx + addl[0] * len + adds[0], sy + addl[1] * len + adds[1], 0.5, -1);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.fireVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fireTexVbo);
        gl.enableVertexAttribArray(this.aColor);
        gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);

        gl.uniform4f(this.uBlk, 0, 0, 0, 0);
        gl.disable(gl.DEPTH_TEST);
        for (let i = 0; i < pos.length; i += 16) {
            //console.log("fire", i, pos.length);
            gl.drawArrays(gl.TRIANGLE_STRIP, i / 4, 4);
        }
    }

    public drawChara(gl: WebGL2RenderingContext, sprite: SpriteData, x: number, y: number, ix: number): void {
        let xx = (x + 1) * 6.5;
        gl.useProgram(this.program);
        gl.viewport(0, 95 - (y + 1) * 10.8 * BLOCK_SIZE, 512, 462);
        gl.enable(gl.BLEND);
        gl.disable(gl.DEPTH_TEST);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.uniform3f(this.uLight, -1, -1, 6.5);
        gl.uniform1i(this.uTex, 0);
        gl.uniform3f(this.uPos, -1, -1, 6.5);
        if (sprite instanceof PlayerSpriteData) {
            const player = sprite as PlayerSpriteData;
            this.drawSprite(gl, sprite.texData, xx, 1, sprite.getTexRect(ix & 1));
            this.drawSprite(gl, player.bodyTex, xx, 1, player.getBodyTexRect(ix), -0.02);
        } else {
            this.drawSprite(gl, sprite.texData, xx, 1, sprite.getTexRect(ix));
        }
    }
    private drawSprite(gl: WebGL2RenderingContext, sprite: WebGLTexture, x: number, y: number, rect: { sx: number; sy: number; ex: number; ey: number; }, zadd = -0.01): void {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteVbo);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteTexVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            rect.sx, rect.sy, -1, 1,
            rect.sx, rect.ey, -1, 1,
            rect.ex, rect.sy, -1, 1,
            rect.ex, rect.ey, -1, 1
        ]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.aColor);
        gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);

        gl.bindTexture(gl.TEXTURE_2D, sprite);
        gl.uniform4f(this.uBlk, x, y, 0, zadd);
        gl.enable(gl.DEPTH_TEST);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

        gl.disable(gl.DEPTH_TEST);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteTexVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
            rect.sx, rect.sy, -1, 0.3,
            rect.sx, rect.ey, -1, 0.3,
            rect.ex, rect.sy, -1, 0.3,
            rect.ex, rect.ey, -1, 0.3
        ]), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.aColor);
        gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
    private drawFlash(gl: WebGL2RenderingContext, x: number, y: number, count: number, type: number): void {
        gl.disable(gl.DEPTH_TEST);
        gl.lineWidth(1);
        let pos: number[] = [];
        let col: number[] = [];
        const max = (type === 0) ? 4 : 8;
        const ht = (type === 0) ? 1 : 1.2;
        let rad = Math.PI * count / 60;
        let acol = Math.min(1, count / 20.0);
        for (let i = 0; i < max; i++) {
            let cos = Math.cos(rad);
            let sin = Math.sin(rad);
            rad += (2 * Math.PI / max);
            pos.push(0.5 + cos * 0.25, 0.5 + sin * 0.1, 0, -1, 0.5 + cos * 0.4, 0.5 + sin * 0.15, ht, -1);
            if (type < 0) {
                col.push(0.2, 0.2, 0.2, acol, 0, 0, 0, acol);
            } else {
                col.push(0.8, 0.8, 0.8, acol, 1, 1, 1, acol);
            }
        }
        gl.uniform4f(this.uBlk, x, y, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.fireVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 4, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.spriteTexVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(col), gl.STATIC_DRAW);
        gl.enableVertexAttribArray(this.aColor);
        gl.vertexAttribPointer(this.aColor, 4, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.LINES, 0, pos.length / 4);
    }
}


let stageRender: StageRender;

export function getStageRender(gl: WebGL2RenderingContext): StageRender {
    if (!stageRender) {
        stageRender = new StageRender(gl);
    }
    return stageRender;
}

export class StagePlay implements IPlay {
    private fontRender: FontRender;
    private stageRender: StageRender;
    private pause: boolean = false;

    public constructor(gl: WebGL2RenderingContext, private stageData: StageData) {
        this.fontRender = getFontRender(gl);
        this.stageRender = getStageRender(gl);
        let bgm = { name: "FloorNormal", start: 1, end: 60 };
        for (let ene of stageData.getEnemyList()) {
            if (ene instanceof Dragon) {
                bgm = { name: "FloorDragon", start: 1, end: 60 };
            } else if (ene instanceof Saccubus) {
                bgm = { name: "FloorIshtar", start: 1, end: 44 };
            }
        }
        if (this.stageData.floorNum === 59) {
            bgm = { name: "FloorDruaga", start: 1, end: 44 };
        } else if (this.stageData.floorNum === 60) {
            bgm = { name: "FloorIshtar", start: 1, end: 44 };
        }
        playBgm(bgm.name, bgm.start, bgm.end).then();
    }
    stepFrame(gl: WebGL2RenderingContext, stick: StickData): IPlay {
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        let playerData = this.stageData.playerData;
        if (!this.pause) {
            this.stageData?.stepFrame(gl);
        }
        if (stick.isPause(true)) {
            this.pause = !this.pause;
        }
        //gl.disable(gl.CULL_FACE);
        this.stageRender.draw(gl, this.stageData!);
        let time = this.stageData!.getTimer();
        gl.clear(gl.DEPTH_BUFFER_BIT);
        /*
        this.fontRender.drawFrame(gl, [-0.9, -0.6, 1.8, 1], [0.2, 0.2, 0.5], [1, 1, 1]);
        this.fontRender.draw(gl, "LODE RUNNER", [-0.75, -0.4, 1.5, 0.3], [0.7, 0.7, 0.9]);
        this.fontRender.draw(gl, "PRESS " + stick.getButtonName(ButtonType.Pause), [-0.5, 0.1, 1, 0.1], [0.8, 0.8, 0.4]);
        */
        gl.viewport(0, 0, 512, 512);
        let tmtxt = time.toString();
        if (tmtxt.length < 5) {
            tmtxt = "    ".substring(0, 5 - tmtxt.length) + tmtxt;
        }
        tmtxt = "TIME " + tmtxt;
        if (this.stageData.isRedTime()) {
            this.fontRender.draw(gl, tmtxt, [0.49, 0.89, 0.5, 0.07], [1, 0.2, 0.2]);
        } else {
            this.fontRender.draw(gl, tmtxt, [0.49, 0.89, 0.5, 0.07], [1, 1, 1]);
        }
        // HP表示
        let hp = playerData.getHP().toString();
        if (hp.length < 3) {
            hp = "  ".substring(0, 3 - hp.length) + hp;
        }
        let hpcol = [1, 1, 1];
        if (playerData.getHP() <= 16) {
            hpcol = [1, 0.2, 0.2];
        }
        this.fontRender.draw(gl, "HP " + hp, [0.69, 0.8, 0.3, 0.07], hpcol);

        if (this.pause) {
            this.fontRender.draw(gl, "PAUSE", [-0.2, -0.1, 0.4, 0.1], [1, 1, 1]);
        }

        const mode = this.stageData.getPlayMode();
        if (mode === PlayMode.Playing) {
            return this;
        }
        if (this.stageData.getGlobalCount() === 0) {
            if (mode === PlayMode.LostWait) {
                // Lost
                if (this.stageData.playerData.lostPlayer()) {
                    return new FloorStart(gl, this.stageData.playerData, this.stageData.floorNum);
                } else {
                    return new GameOverPlay(gl, this.stageData);
                }
            } else if (mode === PlayMode.ClearWait) {
                // 次のステージ
                return new FloorStart(gl, this.stageData.playerData, this.stageData.floorNum + 1);
            } else if (mode === PlayMode.ZapWait) {
                // ZAP
                return new ZapPlay(gl, this.stageData.playerData);
            } else if (mode === PlayMode.AllClear) {
                // クリアー
                return new AllClearPlay(gl, this.stageData);
            }
        }
        return this;
    }
}