const v_shader = `
// xyz, a=色の明るさ
attribute vec4 a_pos;

uniform vec3 u_pos;
uniform vec2 u_size;
uniform vec4 u_color;
varying vec4 v_color;

void main() {
    vec2 addpos = u_pos.xy + u_size.xy / 2.0;
    gl_Position = vec4(a_pos.x * u_size.x + addpos.x, -(a_pos.y * u_size.y) / 2.0 - addpos.y, a_pos.z + u_pos.z, 1.0);
    v_color = vec4(u_color.rgb * a_pos.a, u_color.a);
}
`;

const f_shader = `
precision mediump float;

varying vec4 v_color;

void main() {
    gl_FragColor = v_color;
}
`;

const digitData = [
    0xc3f, 0x406, 0xdb, 0x8f, 0xe6, 0xed, 0xfd, 0x1401, 0xff, 0xe7
];
const alphaData = [
    0xf7, 0x128f, 0x39, 0x120f, 0xf9, 0xf1, 0xbd, 0xf6, 0x1209, 0x1e, 0x2470, 0x38, 0x536, 0x2136,
    0x3f, 0xf3, 0x203f, 0x20f3, 0x18d, 0x1201, 0x3e, 0xc30, 0x2836, 0x2d00, 0x1500, 0xc09
];
const etcData: { [key: string]: number; } = {
    // コロン
    ":": 0xc000,
    // ピリオド
    ".": 0x10000,
    ",": 0x10000,
    "-": 0xc0,
    "/": 0xc00,
    "'": 0x400,
    "!": 0x10400,
    ">": 0x900,
    "<": 0x2400
};

export class FontRender {
    private program: WebGLProgram;
    private aPos: number;
    private uColor: WebGLUniformLocation;
    private uPos: WebGLUniformLocation;
    private uSize: WebGLUniformLocation;
    private posVbo: WebGLBuffer;
    private segmentData: number[][];
    private frameData: number[];

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
        this.uColor = gl.getUniformLocation(this.program, "u_color")!;
        this.uPos = gl.getUniformLocation(this.program, "u_pos")!;
        this.uSize = gl.getUniformLocation(this.program, "u_size")!;
        // buffer
        this.posVbo = gl.createBuffer()!;
        const seg = [
            this.makePolygon([0.4, -0.95], [-0.4, -0.95]),
            this.makePolygon([0.4, -0.9], [0.4, -0.05]),
            this.makePolygon([0.4, 0.05], [0.4, 0.9]),
            this.makePolygon([-0.4, 0.95], [0.4, 0.95]),
            this.makePolygon([-0.4, 0.05], [-0.4, 0.9]),
            this.makePolygon([-0.4, -0.9], [-0.4, -0.05]),
            this.makePolygon([-0.4, 0], [-0.01, 0]),
            this.makePolygon([0.01, 0], [0.4, 0]),
            this.makePolygon([-0.4, -0.9], [-0.05, -0.05]),
            this.makePolygon([0, -0.9], [0, -0.05]),
            this.makePolygon([0.4, -0.9], [0.05, -0.05]),
            this.makePolygon([-0.05, 0.05], [-0.4, 0.9]),
            this.makePolygon([0, 0.05], [0, 0.9]),
            this.makePolygon([0.05, 0.05], [0.4, 0.9]),
            // コロンやピリオド
            [
                0, -0.4, -0.2, 1.0,
                0, -0.6, -0.1, 1.1,
                -0.2, -0.4, -0.1, 1.2,
                0, -0.2, -0.1, 0.8,
                0.2, -0.4, -0.1, 0.9,
                0, -0.6, -0.1, 1.1
            ],
            [
                0, 0.4, -0.2, 1.0,
                0, 0.2, -0.1, 1.1,
                -0.2, 0.4, -0.1, 1.2,
                0, 0.6, -0.1, 0.8,
                0.2, 0.4, -0.1, 0.9,
                0, 0.2, -0.1, 1.1
            ],
            [
                -0.2, 0.8, -0.2, 1.0,
                -0.2, 0.6, -0.1, 1.1,
                -0.4, 0.8, -0.1, 1.2,
                -0.2, 1, -0.1, 0.8,
                0, 0.8, -0.1, 0.9,
                -0.2, 0.6, -0.1, 1.1
            ]
        ];
        let st = 0;
        this.segmentData = [];
        for (let dt of seg) {
            this.segmentData.push([st, dt.length / 4]);
            st += dt.length / 4;
        }
        const frame = [
            -0.5, -1, -0.05, 1,
            -0.5, 1, -0.05, 0.8,
            0.5, -1, -0.05, 0.9,
            0.5, 1, -0.05, 0.7,
            -0.51, -1.02, -0.1, 1,
            -0.49, -0.98, -0.11, 1.1,
            0.51, -1.02, -0.1, 0.9,
            0.49, -0.98, -0.11, 1.0,
            0.51, 1.02, -0.1, 0.7,
            0.49, 0.98, -0.11, 0.8,
            -0.51, 1.02, -0.1, 0.8,
            -0.49, 0.98, -0.11, 0.9,
            -0.51, -1.02, -0.1, 1,
            -0.49, -0.98, -0.11, 1.1
        ];
        this.frameData = [st, 4, st + 4, frame.length / 4 - 4];
        seg.push(frame);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posVbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(seg.flat()), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }

    /**
     * 
     * @param st 
     * @param ed 
     */
    private makePolygon(st: number[], ed: number[]): number[] {
        const dy = ed[1] - st[1];
        const dx = ed[0] - st[0];
        const rad = Math.atan2(dy, dx);
        const addrad = Math.PI * 5 / 16;
        const wd = 0.15;
        const sx1 = Math.cos(rad - addrad) * wd;
        const sy1 = Math.sin(rad - addrad) * wd;
        const sx2 = Math.cos(rad + addrad) * wd;
        const sy2 = Math.sin(rad + addrad) * wd;
        const ex1 = Math.cos(rad + Math.PI + addrad) * wd;
        const ey1 = Math.sin(rad + Math.PI + addrad) * wd;
        const ex2 = Math.cos(rad + Math.PI - addrad) * wd;
        const ey2 = Math.sin(rad + Math.PI - addrad) * wd;
        const cx = (st[0] + ed[0]) / 2.0;
        const cy = (st[1] + ed[1]) / 2.0;
        return [
            cx, cy, -0.1, 1.0,
            st[0], st[1], 0, 1.1,
            st[0] + sx2, st[1] + sy2, 0, 1.2,
            ed[0] + ex2, ed[1] + ey2, 0, 1.0,
            ed[0], ed[1], 0, 0.9,
            ed[0] + ex1, ed[1] + ey1, 0, 0.8,
            st[0] + sx1, st[1] + sy1, 0, 0.9,
            st[0], st[1], 0, 1.1
        ];
    }

    private triangleStrip(pos: number[][], color: number[]): number[] {
        let xyz: number[] = [];
        let bakIx: number[][] = [];
        for (let i = 0; i < pos.length; i++) {
            bakIx.push(pos[i]);
            if (bakIx.length > 3) {
                bakIx.splice(0, 1);
            }
            if (bakIx.length === 3) {
                if (i & 1) {
                    // 逆
                    xyz.push(...bakIx[0], ...bakIx[2], ...bakIx[1]);
                } else {
                    xyz.push(...bakIx[0], ...bakIx[1], ...bakIx[2]);
                }
            }
        }
        let ret: number[] = [];
        for (let i = 0; i < xyz.length; i += 3) {
            ret.push(xyz[i], xyz[i + 1], xyz[i + 2]);
            if (i < 9) {
                ret.push(color[1]);
            } else if (i >= xyz.length - 9) {
                ret.push(color[1]);
            } else {
                ret.push(color[1]);
            }
        }
        return ret;
    }

    public draw(gl: WebGL2RenderingContext, text: string, rect: number[], color: number[], zpos = -0.5): void {
        if (color.length === 3) {
            color = [...color, 1.0];
        }
        let width = rect[2] / text.length;
        let x = rect[0];
        gl.useProgram(this.program);
        gl.enable(gl.DEPTH_TEST);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posVbo);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        for (let i = 0; i < text.length; i++) {
            let ch = text.toUpperCase().charCodeAt(i);
            let flag = 0;
            if (ch >= 48 && ch < 58) {
                // 数字
                flag = digitData[ch - 48];
            } else if (ch >= 65 && ch - 65 < alphaData.length) {
                // 英字
                flag = alphaData[ch - 65];
            } else if (text.charAt(i) in etcData) {
                flag = etcData[text.charAt(i)];
            }
            if (flag > 0) {
                for (let j = 0; j < this.segmentData.length; j++) {
                    if (flag & (1 << j)) {
                        const mx = width / 20.0;
                        const my = rect[3] / 20.0;
                        gl.uniform3f(this.uPos, x, rect[1], zpos);
                        gl.uniform2f(this.uSize, width - mx, rect[3]);
                        gl.uniform4fv(this.uColor, color);
                        gl.drawArrays(gl.TRIANGLE_FAN, this.segmentData[j][0], this.segmentData[j][1]);
                        gl.uniform3f(this.uPos, x + mx, rect[1] + my, zpos + 0.2);
                        gl.uniform2f(this.uSize, width - mx, rect[3]);
                        gl.uniform4fv(this.uColor, [0, 0, 0, color[3]]);
                        gl.drawArrays(gl.TRIANGLE_FAN, this.segmentData[j][0], this.segmentData[j][1]);
                        //gl.drawArrays(gl.LINE_LOOP, this.segmentData[j][0] + 1, this.segmentData[j][1] - 2);
                    }
                }
            }
            x += width;
        }
    }

    public init(gl: WebGL2RenderingContext): void {
        gl.useProgram(this.program);
    }

    public drawFrame(gl: WebGL2RenderingContext, rect: number[], bg: number[], border?: number[]): void {
        gl.useProgram(this.program);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.posVbo);
        gl.enableVertexAttribArray(this.aPos);
        gl.vertexAttribPointer(this.aPos, 4, gl.FLOAT, false, 0, 0);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
        gl.uniform3f(this.uPos, rect[0], rect[1], 0);
        gl.uniform2f(this.uSize, rect[2], rect[3]);
        if (border) {
            if (border.length === 3) {
                border = [...border, 1.0];
            }
            gl.uniform4fv(this.uColor, border);
            gl.drawArrays(gl.TRIANGLE_STRIP, this.frameData[2], this.frameData[3]);
        }
        if (bg.length === 3) {
            bg = [...bg, 1.0];
        }
        gl.uniform4fv(this.uColor, bg);
        gl.drawArrays(gl.TRIANGLE_STRIP, this.frameData[0], this.frameData[1]);
    }
}

let render: FontRender;

export function getFontRender(gl: WebGL2RenderingContext): FontRender {
    if (!render) {
        render = new FontRender(gl);
    }
    return render;
}