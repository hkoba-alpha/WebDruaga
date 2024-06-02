//import { AllClearPlay } from "./AllClearPlay";
import { FontRender, getFontRender } from "./FontRender";
import { IPlay, StickData, saveData } from "./PlayData";
import { playBgm } from "./SoundData";
import { SpriteData } from "./SpriteData";
import { PlayerData, StageData, StageLoader } from "./StageData";
import { StagePlay, StageRender, getStageRender } from "./StagePlay";


const v_shader = `
// xyz
attribute vec3 a_pos;
attribute vec2 a_tex;
attribute vec3 a_normal;
uniform mat4 u_mat;
uniform mat4 u_proj;
uniform vec2 u_pos;
uniform vec3 u_light;

varying vec3 v_tex;
varying float v_diff;

void main() {
    vec3 pos = a_pos + vec3(0.0, 0.0, u_pos.x);
    vec3 light = normalize(u_light);
    gl_Position = u_proj * u_mat * vec4(pos, 1.0);
    v_tex = vec3(a_tex, u_pos.y);
    //v_tex = vec3(a_tex, (gl_Position.z / gl_Position.w + 1.0) / 2.0);
    v_diff = clamp(dot(a_normal, light), 0.2, 1.0);
}
`;

const f_shader = `
precision mediump float;
uniform sampler2D u_tex;

varying vec3 v_tex;
varying float v_diff;

void main() {
    gl_FragColor = texture2D(u_tex, v_tex.xy) * vec4(v_diff, v_diff, v_diff, v_tex.z);
}
`;

// 3次元ベクトルの正規化
function normalize(v: number[]): number[] {
    const len = Math.hypot(v[0], v[1], v[2]);
    return [v[0] / len, v[1] / len, v[2] / len];
}

// 3次元ベクトルの引き算
function subtract(a: number[], b: number[]): number[] {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

// 3次元ベクトルの外積
function cross(a: number[], b: number[]): number[] {
    return [
        a[1] * b[2] - a[2] * b[1],
        a[2] * b[0] - a[0] * b[2],
        a[0] * b[1] - a[1] * b[0]
    ];
}

// 4x4行列の作成
function mat4(): number[] {
    return [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0, 1, 0,
        0, 0, 0, 1
    ];
}

// ビュー行列の計算
function lookAt(eye: number[], target: number[], up: number[]): number[] {
    const zAxis = normalize(subtract(eye, target)); // 視線方向
    const xAxis = normalize(cross(up, zAxis)); // 右方向
    const yAxis = cross(zAxis, xAxis); // 上方向

    const viewMatrix = mat4();

    // 行列の上3行3列に座標変換を設定
    viewMatrix[0] = xAxis[0];
    viewMatrix[1] = yAxis[0];
    viewMatrix[2] = zAxis[0];
    viewMatrix[4] = xAxis[1];
    viewMatrix[5] = yAxis[1];
    viewMatrix[6] = zAxis[1];
    viewMatrix[8] = xAxis[2];
    viewMatrix[9] = yAxis[2];
    viewMatrix[10] = zAxis[2];

    // カメラの位置を考慮して移動行列を設定
    viewMatrix[12] = - (xAxis[0] * eye[0] + xAxis[1] * eye[1] + xAxis[2] * eye[2]);
    viewMatrix[13] = - (yAxis[0] * eye[0] + yAxis[1] * eye[1] + yAxis[2] * eye[2]);
    viewMatrix[14] = - (zAxis[0] * eye[0] + zAxis[1] * eye[1] + zAxis[2] * eye[2]);

    return viewMatrix;
}

function perspective(fovy: number, aspect: number, near: number, far: number): number[] {
    const f = 1.0 / Math.tan(fovy / 2);
    const nf = 1 / (near - far);
    const out = mat4();

    out[0] = f / aspect;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;

    out[4] = 0;
    out[5] = f;
    out[6] = 0;
    out[7] = 0;

    out[8] = 0;
    out[9] = 0;
    out[10] = (far + near) * nf;
    out[11] = -1;

    out[12] = 0;
    out[13] = 0;
    out[14] = (2 * far * near) * nf;
    out[15] = 0;

    return out;
}

let skyName = "sky";

export function setSkyName(name: string): void {
    skyName = name;
}

export class StartRender {
    private program: WebGLProgram;
    private aPos: number;
    private aTex: number;
    private aNormal: number;
    private uMat: WebGLUniformLocation;
    private uProj: WebGLUniformLocation;
    private uTex: WebGLUniformLocation;
    private uPos: WebGLUniformLocation;
    private uLight: WebGLUniformLocation;
    private posVbo: WebGLBuffer;
    private normVbo: WebGLBuffer;
    private texVbo: WebGLBuffer;
    private texture: { [key: string]: WebGLTexture } = {};
    private projMat: number[];
    private gateSprite: SpriteData;

    public constructor(gl: WebGL2RenderingContext) {
        this.gateSprite = new SpriteData(gl, "stage");
        this.projMat = perspective(Math.PI / 4, 1, 0.1, 100);
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
        this.aNormal = gl.getAttribLocation(this.program, "a_normal");
        this.aTex = gl.getAttribLocation(this.program, "a_tex");
        this.uMat = gl.getUniformLocation(this.program, "u_mat")!;
        this.uProj = gl.getUniformLocation(this.program, "u_proj")!;
        this.uTex = gl.getUniformLocation(this.program, "u_tex")!;
        this.uPos = gl.getUniformLocation(this.program, "u_pos")!;
        this.uLight = gl.getUniformLocation(this.program, "u_light")!;
        // buffer
        const pos: number[] = [
            -20, 20, 0,
            -20, -20, 0,
            20, 20, 0,
            20, -20, 0
        ];
        const tex: number[] = [
            0, 0,
            0, 10,
            10, 0,
            10, 10
        ];
        const norm: number[] = [
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0
        ];
        for (let i = 0; i <= 16; i++) {
            const rad = Math.PI * i / 16;
            const x = -Math.cos(rad);
            const y = -Math.sin(rad);
            pos.push(x * 3, y * 3, 1, x * 3, y * 3, 0);
            norm.push(x, y, 0, x, y, 0);
            tex.push(i, 0.4, i, 1);
        }
        // 裏
        for (let i = 0; i <= 16; i++) {
            const rad = Math.PI * i / 16;
            const x = -Math.cos(rad);
            const y = Math.sin(rad);
            pos.push(x * 3, y * 3, 1, x * 3, y * 3, 0);
            norm.push(x, y, 0, x, y, 0);
            tex.push(i, 0.4, i, 1);
        }
        // 床
        pos.push(0, 0, 0);
        norm.push(0, 0, 1);
        tex.push(0.5, 0.5);
        for (let i = 0; i <= 32; i++) {
            const rad = Math.PI * i / 16;
            const x = -Math.cos(rad);
            const y = -Math.sin(rad);
            pos.push(x * 3, y * 3, 0);
            norm.push(0, 0, 1);
            tex.push((x + 1) / 2, (y + 1) / 2);
        }
        pos.push(-3, 3, 0, -3, -3, 0, 3, 3, 0, 3, -3, 0);
        norm.push(0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1);
        tex.push(0, 1, 0, 0, 1, 1, 1, 0);
        // gate
        for (let i = 0; i < 4; i++) {
            const rad = Math.PI * ((i & 1) + 7.95) / 16;
            const x = -Math.cos(rad);
            const y = -Math.sin(rad);
            pos.push(x * 3.1, y * 3.1, 0.7, x * 3.1, y * 3.1, 0);
            norm.push(x, y, 0, x, y, 0);
        }
        tex.push(0, 0, 0, 1, 1 / 6.0, 0, 1 / 6.0, 1);
        tex.push(1 / 6.0, 0, 1 / 6.0, 1, 2 / 6.0, 0, 2 / 6.0, 1);
        this.posVbo = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(pos), gl.STATIC_DRAW);
        this.normVbo = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(norm), gl.STATIC_DRAW);
        this.texVbo = gl.createBuffer()!;
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(tex), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        // texture
        const imageFiles = ['block', 'ground', 'sky', 'sky2', 'sky3', 'sky4'];
        const render = getStageRender(gl);
        for (let fl of imageFiles) {
            this.texture[fl] = render.getTexture(gl, fl);
        }
    }

    public draw(gl: WebGL2RenderingContext, length: number, nearHeight: number, lookHeight: number, floorTex?: WebGLTexture, opend = false): void {
        if (length < 2) {
            gl.clearColor(0, 0, 0, 1);
        } else {
            gl.clearColor(0.1, 0.2, 0.8, 1);
        }
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.clear(gl.DEPTH_BUFFER_BIT);
        gl.viewport(0, 0, 512, 512);
        gl.useProgram(this.program);
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        //gl.disable(gl.CULL_FACE);
        gl.enable(gl.DEPTH_TEST);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posVbo);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.normVbo);
        gl.enableVertexAttribArray(this.aNormal);
        gl.vertexAttribPointer(this.aNormal, 3, gl.FLOAT, false, 0, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texVbo);
        gl.enableVertexAttribArray(this.aTex);
        gl.vertexAttribPointer(this.aTex, 2, gl.FLOAT, false, 0, 0);

        gl.activeTexture(gl.TEXTURE0);
        gl.uniform1i(this.uTex, 0);
        gl.uniformMatrix4fv(this.uProj, false, this.projMat);
        if (length > 2) {
            // sky
            gl.uniform3f(this.uLight, 0, 0, 1);
            gl.bindTexture(gl.TEXTURE_2D, this.texture[skyName]);
            const rad = Math.atan2(lookHeight - nearHeight, length);
            const mat = lookAt([0, -rad, 4], [0, -rad, 0], [0, -1, 0]);
            gl.uniform2f(this.uPos, 0, 1);
            gl.uniformMatrix4fv(this.uMat, false, new Float32Array(mat));
            gl.drawArrays(gl.TRIANGLE_STRIP, 106, 4);
            gl.clear(gl.DEPTH_BUFFER_BIT);
        }

        gl.bindTexture(gl.TEXTURE_2D, this.texture['ground']);

        const mat = lookAt([0, -length, nearHeight], [0, 0, lookHeight], [0, lookHeight < nearHeight ? 1 : 0, 1]);
        gl.uniformMatrix4fv(this.uMat, false, new Float32Array(mat));
        gl.uniform3f(this.uLight, 1, -1, -1);

        gl.uniform2f(this.uPos, 0, 1);
        if (length > 4) {
            gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        }

        if (length < 1 && floorTex) {
            gl.uniform3f(this.uLight, 0, 0, 1);
            gl.uniform2f(this.uPos, lookHeight, 1);
            gl.bindTexture(gl.TEXTURE_2D, floorTex);
            gl.drawArrays(gl.TRIANGLE_STRIP, 106, 4);
            return;
        }
        if (length < 8) {
            // FAN
            if (floorTex) {
                gl.uniform3f(this.uLight, 0, 0, 1);
                gl.uniform2f(this.uPos, lookHeight + 0.01, 1);
                gl.bindTexture(gl.TEXTURE_2D, floorTex);
                gl.drawArrays(gl.TRIANGLE_FAN, 72, 34);
            }
            gl.bindTexture(gl.TEXTURE_2D, this.texture['block']);
            gl.uniform3f(this.uLight, 1, -1, -1);
            for (let i = Math.floor(lookHeight); i < 60; i++) {
                gl.uniform2f(this.uPos, i, 1);
                gl.drawArrays(gl.TRIANGLE_STRIP, 38, 34);
            }
        } else {
            gl.bindTexture(gl.TEXTURE_2D, this.texture['block']);
        }
        for (let i = 0; i < 60; i++) {
            let alpha = 1;
            if (length < 8 && i >= lookHeight) {
                alpha = Math.max(0, (length - 4) / 5.0);
            }
            gl.uniform2f(this.uPos, i, alpha);
            gl.drawArrays(gl.TRIANGLE_STRIP, 4, 34);
        }
        // gate
        gl.uniform2f(this.uPos, 0, 1);
        gl.bindTexture(gl.TEXTURE_2D, this.gateSprite.texData);
        gl.drawArrays(gl.TRIANGLE_STRIP, opend ? 114 : 110, 4);

        gl.flush();
    }

    public makeStageTexture(gl: WebGL2RenderingContext, render: StageRender, stage: StageData, startDraw = true): WebGLTexture {
        const buffer = gl.createFramebuffer()!;

        gl.bindFramebuffer(gl.FRAMEBUFFER, buffer);
        const depth = gl.createRenderbuffer()!;
        gl.bindRenderbuffer(gl.RENDERBUFFER, depth);
        gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, 512, 512);
        gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depth);

        const floorTex = gl.createTexture()!;

        gl.bindTexture(gl.TEXTURE_2D, floorTex);

        // フレームバッファ用のテクスチャにカラー用のメモリ領域を確保
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 512, 512, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

        // テクスチャパラメータ
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, floorTex, 0);

        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, 512, 512);
        render.draw(gl, stage, startDraw);

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.bindRenderbuffer(gl.RENDERBUFFER, null);
        gl.deleteFramebuffer(buffer);
        gl.deleteRenderbuffer(depth);

        return floorTex;
    }
}

let startRender: StartRender;

export function getStartRender(gl: WebGL2RenderingContext): StartRender {
    if (!startRender) {
        startRender = new StartRender(gl);
    }
    return startRender;
}

const STEP_COUNT = 60;

export class FloorStart implements IPlay {
    static stageLoader: StageLoader;
    static gameMode: number = 0;

    private count: number = 100;
    private fontRender: FontRender;
    private startRender: StartRender;
    private stageRender: StageRender;
    private length = 20;
    private near = 2;
    private look = 30;
    private stageData?: StageData;
    // モード 0:視点移動, 1:近づく
    private mode = 0;

    private floorTex?: WebGLTexture;

    /**
     * 
     */
    private posData: {
        length: number;
        look: number;
        near: number;
    }[] = [
            {
                length: 20,
                look: 1,
                near: 2
            },
            {
                length: 20,
                look: 30,
                near: 2
            },
            {
                length: 20,
                look: 30,
                near: 2
            },
            {
                length: 20,
                look: 0,
                near: 1
            },
            {
                length: 10,
                look: 0,
                near: 1
            },
            {
                length: 2,
                look: 0,
                near: 1
            },
            {
                length: 0,
                look: 0,
                near: 4,
            }
        ];

    public constructor(gl: WebGL2RenderingContext, private playerData: PlayerData, private stageNum: number, save = false) {
        this.startRender = getStartRender(gl);
        this.stageRender = getStageRender(gl);
        let mode = Math.floor(this.playerData.saveNum / 5);
        if (mode !== FloorStart.gameMode || !FloorStart.stageLoader) {
            FloorStart.gameMode = mode;
            const file = ["stage", "stage", "ura2", "ura3"];
            new StageLoader().loadStage(file[mode]).then(res => {
                FloorStart.stageLoader = res;
                if (mode === 1) {
                    res.loadStage("ura1").then();
                }
            });
        }
        this.fontRender = getFontRender(gl);
        if (save) {
            this.playerData.saveData(stageNum, stageNum, false).then();
        } else {
            saveData.getSaveData(this.playerData.saveNum).then(dt => {
                this.playerData.saveData(stageNum, Math.max(dt.data.maxStage, stageNum), false).then();
            });
        }
        const target = stageNum;
        this.posData[3].look = target - 1;
        this.posData[3].near = Math.min(30, target);
        this.posData[4].look = target - 1;
        this.posData[4].near = Math.min(58, target);
        this.posData[5].look = target - 1;
        this.posData[5].near = target + 1;
        this.posData[6].look = target - 1;
        this.posData[6].near = target + 6.4;
        this.length = this.posData[0].length;
        this.look = this.posData[0].look;
        this.near = this.posData[0].near;

        playBgm('FloorStart', 1).then(() => { this.count = 30; });
    }
    private makeStage(gl: WebGL2RenderingContext): void {
        this.stageData = FloorStart.stageLoader.getStage(gl, this.playerData, this.stageNum);
        this.floorTex = this.startRender.makeStageTexture(gl, this.stageRender, this.stageData);
    }
    stepFrame(gl: WebGL2RenderingContext, stick: StickData): IPlay {
        if (this.mode > 0 && this.mode < this.posData.length) {
            const dt1 = this.posData[this.mode - 1];
            const dt2 = this.posData[this.mode];
            this.length = (dt1.length - dt2.length) * this.count / STEP_COUNT + dt2.length;
            this.look = (dt1.look - dt2.look) * this.count / STEP_COUNT + dt2.look;
            this.near = (dt1.near - dt2.near) * this.count / STEP_COUNT + dt2.near;
        }
        gl.clearColor(0, 0, 0, 1);
        gl.clearDepth(1.0);
        gl.viewport(0, 0, 512, 512);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);
        //this.startRender.draw(gl, this.length, this.near, this.look, this.stageData);
        this.startRender.draw(gl, this.length, this.near, this.look, this.floorTex, this.stageNum === 1 && this.length < 10);
        let text = "FLOOR " + this.stageNum;
        this.fontRender.draw(gl, text, [-text.length / 20, -0.1, text.length * 0.1, 0.1], [1, 1, 1]);
        gl.flush();
        this.count--;
        if (this.count === 0) {
            this.count = STEP_COUNT;
            this.mode++;
            if (this.mode === 2) {
                //this.stageData = FloorStart.stageLoader.getStage(gl, this.playerData, this.stageNum);
                this.makeStage(gl);
            } else if (this.mode >= this.posData.length) {
                if (this.floorTex) {
                    gl.deleteTexture(this.floorTex);
                }
                // TODO
                /*
                if (this.stageNum === 60) {
                    return new AllClearPlay(gl, this.stageData!);
                }
                */
                return new StagePlay(gl, this.stageData!);
            }
        }
        return this;
    }
}