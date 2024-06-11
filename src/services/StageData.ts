/**
 * 16x16がキャラ１つ
 * 24x24がブロック１つ
 */

import { SaveData, StickData, saveData } from "./PlayData";
import { playBgm, playEffect, setChime } from "./SoundData";
import { PlayerSpriteData, SpriteData } from "./SpriteData";

export const STAGE_FILE_NAME = "stage";

export const FLOOR_WIDTH = 18;
export const FLOOR_HEIGHT = 9;

export const KEY_ITEM = "key";
export const MATTOCK_ITEM = "MATTOCK";
export const BOOTS_ITEM = "BOOTS";
export const CANDLE_ITEM = "CANDLE";
export const BOOK_ITEM = "BOOK";
export const SWORD_ITEM = "SWORD";
export const NECKLACE_ITEM = "NECKLACE";
export const POTION_ITEM = "POTION";
export const CHIME_ITEM = "CHIME";
export const GUNTLET_ITEM = "GUNTLET";
export const ARMOR_ITEM = "ARMOR";
export const SHIELD_ITEM = "SHIELD";
export const RING_ITEM = "RING";
export const BALANCE_ITEM = "BALANCE";
export const PEARL_ITEM = "PEARL";
export const HELMET_ITEM = "HELMET";
export const ROD_ITEM = "ROD";
export const MEITH_ITEM = "MEITH";
export const DUMMY_ITEM = "dummy";


/**
 * ブロックのドット数
 */
export const BLOCK_SIZE = 24;

export enum PlayMode {
    StarWait,
    Playing,
    LostWait,
    ClearWait,
    ReturnWait,
    ZapWait,
    AllClear
}

const itemIndexList = [
    "MATTOCK:1",
    "MATTOCK:2",
    "MATTOCK:3",
    "CANDLE:1",
    "CANDLE:2",
    "BOOTS:1",
    "BOOK:1",
    "SWORD:1",
    "SWORD:2",
    "SWORD:3",
    "MEITH:1",
    "MEITH:2",
    "CHIME:1",
    "BOOK:2",
    "ROD:1",
    "ROD:2",
    "ROD:4",
    "GUNTLET:1",
    "GUNTLET:2",
    "PEARL:1",
    "BOOK:3",
    "RING:1",
    "RING:2",
    "RING:3",
    "ARMOR:1",
    "ARMOR:2",
    "BALANCE",
    "BOOK:4",
    "NECKLACE:1",
    "NECKLACE:2",
    "NECKLACE:3",
    "SHIELD:1",
    "SHIELD:2",
    "HELMET:1",
    "key",
    "POTION:1",
    "POTION:2",
    "POTION:3",
    "POTION:4",
    "POTION:5",
    "POTION:6",
    "POTION:7",
    "BOOK:5",   // BOOK OF SLIME
    "BOOK:6",
    "MATTOCK:4"
];

export const POTION_OF_HEALING = "POTION:1";
export const POTION_OF_POWER = "POTION:2";
export const POTION_OF_ENEGY_DRAIN = "POTION:3";
export const POTION_OF_DRAGON_POT = "POTION:4";
export const POTION_OF_UNLOCK = "POTION:5";
export const POTION_OF_DEATH = "POTION:6";
export const POTION_OF_CURE = "POTION:7";

let timerProc: (gl: WebGL2RenderingContext, data: StageData) => void;

export interface Stage {
    data: string[];
    enemy: string[];
    treasure: string;
    init: string[];
    event: string;
}

export class StageLoader {
    private dataList: Stage[] = [];
    private lastData?: {
        stageNum: number;
        data: StageData;
    };

    public constructor() {
        for (let i = 1; i <= 60; i++) {
            this.dataList[i] = {
                data: [],
                enemy: [],
                treasure: "",
                init: [],
                event: ""
            };
        }
    }

    public async loadStage(fname: string) {
        const res = await fetch(`stage/${fname}.txt`);
        const lst = (await res.text()).split(/\n/);
        let last: Stage | undefined;
        let lastData: Stage | undefined;
        let initFloor = false;
        for (let txt of lst) {
            if (txt.trim().length === 0 || txt.charAt(0) === '#') {
                continue;
            }
            if (txt.charAt(0) === '[') {
                // 開始
                let ix = txt.indexOf(']');
                // Initイベント
                let sx = txt.indexOf(':');
                let stg = 0;
                let init: string[] = [];
                if (sx > 0 && sx < ix) {
                    stg = parseInt(txt.substring(1, sx));
                    init = txt.substring(sx + 1, ix).split(',');
                } else {
                    stg = parseInt(txt.substring(1, ix));
                }
                let treasure = txt.substring(ix + 1).trim().split('=');
                last = this.dataList[stg];
                if (treasure.length > 1) {
                    last.event = treasure[1].trim();
                }
                last.init = init;
                last.treasure = treasure[0];
            } else if (last) {
                if (last !== lastData) {
                    lastData = last;
                    last.enemy = [];
                    initFloor = true;
                }
                if (last.enemy.length === 0) {
                    last.enemy.push(...txt.split(','));
                } else {
                    if (initFloor) {
                        last.data = [];
                        initFloor = false;
                    }
                    last.data.push(txt);
                }
            }
        }
        return this;
    }

    public getStage(gl: WebGL2RenderingContext, player: PlayerData, stage: number): StageData {
        if (!this.lastData || this.lastData.stageNum !== stage || this.lastData.data.playerData !== player) {
            if (this.lastData) {
                this.lastData.data.close(gl);
            }
            this.lastData = {
                stageNum: stage,
                data: new StageData(player, stage)
            };
        }
        this.lastData.data.initStage(gl, this.dataList[stage]);
        return this.lastData.data;
    }
    public getData(stage: number): Stage {
        return this.dataList[stage];
    }
}

const enemyCreateMap: { [name: string]: any; } = {
};

/**
 * 敵情報の登録
 * @param name 名前
 * @returns 
 */
export function EnemyEntry(name: string, option?: { size?: number;[key: string]: any; }) {
    // 実際のデコレーター関数
    return function (target: any, key: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        if (option) {
            enemyCreateMap[name] = function (gl: WebGL2RenderingContext, data: StageData, name: string, num: number) {
                if (option.size) {
                    EnemyData.setDefaultSize(option.size);
                }
                originalMethod(gl, data, name, num, option);
                EnemyData.setDefaultSize(0);
            };
        } else {
            enemyCreateMap[name] = originalMethod;
        }
        /*
        descriptor.value = function (gl: WebGL2RenderingContext, data: StageData, name: string, num: number) {
            originalMethod(gl, data, name, num);
        };
        */
        return descriptor;
    };
}

export class FloorInitBase {
    public init(gl: WebGL2RenderingContext, data: StageData): void {

    }
    public clear(data: StageData): void {

    }
}


const floorInitMap: { [name: string]: any; } = {
};

/**
 * 
 * @param name 
 * @returns 
 */
export function FloorInit(name: string) {
    return function (clazz: Function) {
        floorInitMap[name] = clazz;
    }
}

export interface EventData {
    type: string;
    value?: any;
}

/**
 * イベントの結果
 */
export enum EventResult {
    None,   // 変化なし(OKもNGの可能性もある)
    Next,   // 次に進む
    NG,     // 失敗
    OK,     // 成功(Noneに戻る可能性もある)
    Hold    // 失敗の可能性もある暫定OK
}

/**
 * 移動する方向を取得する
 * @param dir 1:上, 2:右, 3:下, 4:左
 * @returns 
 */
export function getMoveAdd(dir: number): { ax: number; ay: number; } {
    let ax = 0;
    let ay = 0;
    switch (dir) {
        case 1:
            ay = -1;
            break;
        case 2:
            ax = 1;
            break;
        case 3:
            ay = 1;
            break;
        case 4:
            ax = -1;
            break;
    }
    return {
        ax: ax,
        ay: ay
    };
}

export abstract class EventBase {
    public init(gl: WebGL2RenderingContext, data: StageData): void {
    }
    public abstract checkEvent(data: StageData, event: EventData[]): EventResult;

    protected getCount(event: EventData[], type: string, check: (value: any) => boolean): number {
        let count = 0;
        for (let evt of event) {
            if (evt.type === type) {
                if (check(evt.value)) {
                    count++;
                }
            }
        }
        return count;
    }
}

const eventCreateMap: { [name: string]: any } = {};

export function EventEntry(name: string) {
    // 実際のデコレーター関数
    return function (target: any, key: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        eventCreateMap[name] = originalMethod;
        descriptor.value = function (...args: any) {
            originalMethod(...args);
        };
        return descriptor;
    };
}
function parseChild(event: string, parent: { proc: any; child: any[]; }): string {
    let sx = 0;
    for (let i = 0; i < event.length; i++) {
        let ch = event.charAt(i);
        if (ch === '(') {
            // イベント
            let name = event.substring(sx, i);
            if (name in eventCreateMap) {
                let child = { proc: eventCreateMap[name], child: [] };
                event = parseChild(event.substring(i + 1), child);
                parent.child.push(child.proc(...child.child));
                sx = 0;
                i = -1;
                continue;
            } else {
                throw "No Event: " + name;
            }
        } else if (ch === ')') {
            // 終了
            if (i > sx) {
                parent.child.push(event.substring(sx, i));
            }
            return event.substring(i + 1);
        } else if (ch === ',') {
            if (i > sx) {
                // 文字列追加
                parent.child.push(event.substring(sx, i));
            }
            sx = i + 1;
        }
    }
    return "";
}
function parseEvent(event: string): EventBase | undefined {
    // ツリーの作成
    try {
        let top = { proc: null, child: [] };
        parseChild(event, top);
        return top.child[0];
    } catch (e) {
        console.log(e);
    }
    return undefined;
}

export class HitRect {
    public constructor(public readonly sx: number, public readonly sy: number, public readonly ex: number, public readonly ey: number) {

    }

    public isHit(x: number, y: number): boolean {
        return this.sx <= x && this.ex > x && this.sy <= y && this.ey > y;
    }

    public isIntersect(other: HitRect): boolean {
        return this.sx < other.ex && this.ex > other.sx && this.sy < other.ey && this.ey > other.sy;
    }
}

export interface SpritePosition {
    x: number;
    y: number;
    index: number;
    type?: number;  // 0:普通, 1:Small, 2:Big
}

export abstract class EnemyData {
    public removed: boolean = false;
    protected curX: number;
    protected curY: number;
    protected nextX: number;
    protected nextY: number;
    protected moveCount: number;
    protected damagePoint: number = 200;
    private moveDiv: number = 0;
    /**
     * サイズ
     * 0: 普通
     * 1: Small
     * 2: Big
     */
    public sizeType: number = 0;

    private static defaultSize = 0;

    public static setDefaultSize(type: number): void {
        this.defaultSize = type;
    }

    protected constructor(public readonly name: string, public readonly spriteData: SpriteData) {
        this.sizeType = EnemyData.defaultSize;
        this.curX = 0;
        this.curY = 0;
        this.nextX = this.curX;
        this.nextY = this.curY;
        this.moveCount = 0;
    }
    public moveTo(x: number, y: number, count: number): void {
        this.nextX = x;
        this.nextY = y;
        this.moveCount = count;
    }
    public getHP(): number {
        return 1;
    }
    public init(bx: number, by: number): void {
        this.curX = bx * BLOCK_SIZE;
        this.curY = by * BLOCK_SIZE;
        this.nextX = this.curX;
        this.nextY = this.curY;
        this.moveCount = 0;
    }
    /**
     * 宝箱イベントから呼ばれる
     * @param data
     * @param options 
     */
    public onEvent(data: StageData, options: string[]): void {
    }

    public getPosition(): { x: number; y: number; } {
        return {
            x: this.curX,
            y: this.curY
        };
    }
    protected checkDamage(player: PlayerData): boolean {
        const attack = player.getAttackRect();
        if (attack) {
            return attack.isHit(this.curX + 7, this.curY + 7);
        }
        return false;
    }
    protected checkAttack(player: PlayerData): boolean {
        const attack = this.getAttackRect();
        if (attack) {
            const pos = player.getBodyPos();
            return attack.isHit(pos.x, pos.y);
        }
        return false;
    }

    protected onDead(data: StageData): void {
        data.removeEnemy(this);
        data.addEvent({ type: "Dead", value: this.name });
        playEffect('Dead').then();
    }

    protected gotDamage(data: StageData): void {
        this.onDead(data);
    }
    protected attacked(data: StageData): void {
        data.playerData.addHP(-this.damagePoint);
    }

    public stepFrame(gl: WebGL2RenderingContext, data: StageData): void {
        if (this.moveCount === 0) {
            this.moveDiv = 0;
            this.nextMove(gl, data);
        }
        if (this.removed) {
            return;
        }
        if (this.moveCount > 0) {
            //const dx = (this.nextX < this.curX) ? -Math.round((this.curX - this.nextX) / this.moveCount) : Math.round((this.nextX - this.curX) / this.moveCount);
            //const dy = (this.nextY < this.curY) ? -Math.round((this.curY - this.nextY) / this.moveCount) : Math.round((this.nextY - this.curY) / this.moveCount);
            let dx = this.nextX - this.curX;
            let dy = this.nextY - this.curY;
            if (dx) {
                if (Math.abs(dx) >= this.moveCount) {
                    dx = Math.sign(dx) * Math.round(Math.abs(dx) / this.moveCount);
                } else {
                    if (this.moveDiv === 0) {
                        this.moveDiv = this.moveCount / Math.abs(dx);
                    }
                    if (this.moveCount % this.moveDiv) {
                        dx = 0;
                    } else {
                        dx = Math.sign(dx);
                    }
                }
            }
            if (dy) {
                if (Math.abs(dy) >= this.moveCount) {
                    dy = Math.sign(dy) * Math.round(Math.abs(dy) / this.moveCount);
                } else {
                    if (this.moveDiv === 0) {
                        this.moveDiv = this.moveCount / Math.abs(dy);
                    }
                    if (this.moveCount % this.moveDiv) {
                        dy = 0;
                    } else {
                        dy = Math.sign(dy);
                    }
                }
            }
            this.curX += dx;
            this.curY += dy;
            this.moveCount--;
        }
        if (this.checkDamage(data.playerData)) {
            // ダメージを受けた
            this.gotDamage(data);
        }
        if (this.removed) {
            return;
        }
        if (this.checkAttack(data.playerData)) {
            this.attacked(data);
            if (data.playerData.getHP() === 0) {
                return;
            }
        }
    }
    protected abstract nextMove(gl: WebGL2RenderingContext, data: StageData): void;
    public abstract getSpritePosition(): SpritePosition | null;

    public getAttackRect(): HitRect {
        return new HitRect(this.curX + 1, this.curY + 1, this.curX + 15, this.curY + 15);
    }
}

const SWORD_MIDDLE = 48;
const SWORD_END = 84;

export class PlayerData {
    public readonly spriteData: PlayerSpriteData;

    /**
     * 体力
     * 開始: 48
     * ハイパーヘルメット: フロア38以降は96
     * 偽のヘルメット: 16
     * ブルーラインアーマーで、呪文を盾以外で受けると 1 にする
     * 青い薬で +48
     * オレンジの薬は 16にする
     * ナイト、ローパー、ドラゴン、ドルアーガと戦闘（剣を出している）すると1frame: -1
     * リザードマンと戦闘 1frame: -2
     * ナイト、リザードマン、ドルアーガ？は剣を出していないと死ぬ
     * ドラゴンは剣を出していなくても -1 減る
     * ローパーは剣を出していないと HP=1 になる
     */
    private hitPoint: number = 48;

    private x: number = 0;
    private y: number = 0;

    /**
     * 1frame=0.5
     * ジェットブーツで 1frame=1
     */
    private speed: number = 1;

    private walkFlag: boolean = false;
    /**
     * 方向
     * 1:上, 2:右, 3:下, 4:左
     */
    private dir: number = 3;

    private footCount: number = 0;

    private itemMap: { [key: string]: number; } = {};

    /**
     * イビルアイテムを取らされた
     */
    private evilMap: { [key: string]: boolean; } = {};

    /**
     * モード
     * 0: しまっている
     * 1: 出している
     * 2: しまい始めている
     */
    private swordMode: number = 0;
    /**
     * 剣の出しているカウンター
     * 0: 完全にしまっている
     * 32: 完全に出している
     * 64: しまい終わった(0に戻る)
     */
    private swordCount: number = 0;

    /**
     * 剣の出る速さ
     */
    private swordSpeed = 1;

    /**
     * 残りで使えるマトック
     */
    private restMattock = 0;

    /**
     * アイテムを描画するリスト
     * [0]=宝
     * [1]=鍵
     * [2]〜開始時に持っていたアイテム
     */
    private drawItemList: number[] = [];

    private resetState: boolean = false;

    /**
     * チャイムの残り表示時間
     */
    private chimeCount: number = 0;

    /**
     * チャイムの方向
     */
    private chimeDir: number = 0;

    /**
     * 残りプレイ
     */
    private resetPlayer: number = 2;

    /**
     * コンティニュー回数
     */
    private playCount: number = 0;

    public constructor(gl: WebGL2RenderingContext, public readonly stick: StickData, public readonly saveNum: number) {
        this.spriteData = new PlayerSpriteData(gl);
        /*
        this.itemMap[MATTOCK_ITEM] = 3;
        this.itemMap[BOOTS_ITEM] = 1;
        this.itemMap[SWORD_ITEM] = 3;
        this.itemMap[GUNTLET_ITEM] = 2;
        this.itemMap[NECKLACE_ITEM] = 2;
        this.itemMap[RING_ITEM] = 2;
        this.itemMap[ARMOR_ITEM] = 2;
        this.itemMap[SHIELD_ITEM] = 2;
        this.itemMap[HELMET_ITEM] = 1;
        //this.itemMap[ROD_ITEM] = 7;
        this.itemMap[CANDLE_ITEM] = 1;
        this.itemMap[POTION_ITEM] = 4;
        this.itemMap[BOOK_ITEM] = 4;
        this.itemMap[PEARL_ITEM] = 1;
        */
        this.init(gl, 0, 0);
    }

    public async loadData(): Promise<{ curStage: number; maxStage: number; continueFlag: boolean; }> {
        const dt = await saveData.getSaveData(this.saveNum);
        this.itemMap = dt.data.itemMap;
        this.evilMap = dt.data.evilMap;
        this.playCount = (dt.data.continueCount || 0);
        this.resetPlayer = dt.data.restPlayer;
        if (dt.data.continueFlag && dt.data.restPlayer < 0) {
            // コンティニュー可能
            this.resetPlayer = 2;
            this.playCount++;
        }
        return dt.data;
    }
    public getPlayCount(): number {
        return this.playCount;
    }
    public async saveData(curStage: number, maxStage: number, contFlag: boolean): Promise<void> {
        await saveData.updateSaveData({
            num: this.saveNum,
            data: {
                curStage: curStage,
                continueFlag: contFlag,
                restPlayer: this.resetPlayer,
                continueCount: this.playCount,
                itemMap: this.itemMap,
                evilMap: this.evilMap,
                maxStage: maxStage
            }
        });
    }

    public getRest(): number {
        return this.resetPlayer;
    }
    /**
     * 
     * @returns false:ゲームオーバー
     */
    public lostPlayer(): boolean {
        // 偽のブルークリスタルロッドは消える
        if (ROD_ITEM in this.evilMap) {
            this.lostItem(ROD_ITEM + ':4');
        }
        if (this.hasItem(POTION_OF_HEALING)) {
            this.lostItem(POTION_OF_HEALING);
            return true;
        }
        this.resetPlayer--;
        return this.resetPlayer >= 0;
    }

    private recalcState(gl: WebGL2RenderingContext): void {
        this.resetState = false;
        let equip = [this.getItem(HELMET_ITEM) > 0 ? 1 : 0, 0, 0, 0, 0, this.getItem(BOOTS_ITEM) > 0 ? 1 : 0];
        const am = this.getItem(ARMOR_ITEM);
        if (am > 0) {
            equip[1] = am;
        }
        const sh = this.getItem(SHIELD_ITEM);
        if (sh > 0) {
            equip[2] = sh;
        }
        const sw = this.getItem(SWORD_ITEM);
        if (sw > 0) {
            equip[3] = sw;
        }
        const gu = this.getItem(GUNTLET_ITEM);
        if (gu > 0) {
            equip[4] = gu;
        }
        this.spriteData.setState(gl, equip);
    }

    public init(gl: WebGL2RenderingContext, bx: number, by: number): void {
        this.drawItemList = [-1, -1];
        this.x = bx * BLOCK_SIZE;
        this.y = by * BLOCK_SIZE;
        this.walkFlag = false;
        this.swordCount = SWORD_MIDDLE + 4;
        this.swordMode = 2;
        this.chimeDir = 0;
        this.chimeCount = this.getItem(CHIME_ITEM) > 0 ? 128 : 0;
        this.hitPoint = this.getItem(HELMET_ITEM) > 0 ? 96 : 48;
        if (HELMET_ITEM in this.evilMap) {
            this.hitPoint = 16;
        }
        this.dir = 3;
        this.initMattock(0);
        for (let i = 0; i < itemIndexList.length; i++) {
            if (this.hasItem(itemIndexList[i])) {
                this.drawItemList.push(i);
            }
        }
        this.recalcState(gl);
    }
    private initMattock(add: number): void {
        const type = this.getItem(MATTOCK_ITEM);
        this.restMattock = 0;
        if (type === 1) {
            // カッパーは宝の前後は2
            this.restMattock = 2;
        } else if (type === 2) {
            this.restMattock = Math.floor(Math.random() * 3) + 2 + add;
        } else if (type >= 3) {
            this.restMattock = 255;
        }
        // ブーツもチェック
        if (this.getItem(BOOTS_ITEM) > 0) {
            this.speed = 1;
        } else {
            this.speed = 2;
        }
        // ガントレットもチェック
        const gunt = this.getItem(GUNTLET_ITEM);
        if (gunt === 0) {
            this.swordSpeed = 0;
        } else if (gunt > 1) {
            this.swordSpeed = 2;
        } else {
            this.swordSpeed = 1;
        }
    }
    /**
     * ZAPでアイテムをランダムで無くす
     */
    public zap(): void {
        const items = Object.keys(this.itemMap);
        for (let item of items) {
            if (Math.random() < 0.4) {
                this.lostItem(item);
            }
        }
    }
    public getDrawItemList(): number[] {
        return this.drawItemList;
    }
    public getPosition(): { x: number; y: number; } {
        return {
            x: this.x,
            y: this.y
        };
    }

    public isWalk(): boolean {
        return this.walkFlag;
    }
    /**
     * チャイムを表示するかどうか
     * @returns -1, -2: 左, 1, 2: 右
     */
    public getChimePos(): number {
        if (this.chimeDir !== 0) {
            return this.chimeDir * ((this.chimeCount & 8) > 0 ? 2 : 1);
        }
        return 0;
    }

    public addHP(add: number): void {
        if (!add) {
            return;
        }
        this.hitPoint += add;
        /*
        const maxhp = this.getItem(HELMET_ITEM) > 0 ? 96 : 48;
        if (this.hitPoint > maxhp) {
            this.hitPoint = maxhp;
        }
        */
        if (this.hitPoint <= 0) {
            this.hitPoint = 0;
        } else {
        }
    }
    public getHP(): number {
        return this.hitPoint;
    }
    public getDir(): number {
        return this.dir;
    }
    public setDir(dir: number): void {
        this.dir = dir;
    }

    public stepNext(gl: WebGL2RenderingContext, data: StageData): void {
        let dx = 0;
        let dy = 0;
        if (this.stick.isLeft()) {
            dx = -1;
        } else if (this.stick.isRight()) {
            dx = 1;
        } else if (this.stick.isUp()) {
            dy = -1;
        } else if (this.stick.isDown()) {
            dy = 1;
        }
        this.walkFlag = (dx !== 0 || dy !== 0);
        if (data.getGlobalCount() % this.speed === 0) {
            // 移動可能
            if (dx !== 0) {
                this.footCount = (this.footCount + 1) & 7;
                if (this.y % BLOCK_SIZE !== 0) {
                    // 縦がずれている
                    if (this.dir === 1) {
                        this.y--;
                    } else {
                        this.y++;
                    }
                } else {
                    this.dir = dx > 0 ? 2 : 4;
                    if (this.x % BLOCK_SIZE !== 0 || data.canMove(this.x / BLOCK_SIZE, this.y / BLOCK_SIZE, dx, 0)) {
                        this.x += dx;
                    }
                }
            } else if (dy !== 0) {
                this.footCount = (this.footCount + 1) & 7;
                if (this.x % BLOCK_SIZE !== 0) {
                    // 横がずれている
                    if (this.dir === 2) {
                        this.x++;
                    } else {
                        this.x--;
                    }
                } else {
                    this.dir = dy < 0 ? 1 : 3;
                    if (this.y % BLOCK_SIZE !== 0 || data.canMove(this.x / BLOCK_SIZE, this.y / BLOCK_SIZE, 0, dy)) {
                        this.y += dy;
                    }
                }
            }
            if (KEY_ITEM in this.itemMap) {
                // 鍵を持っている
                const pos = data.getDoorPos();
                if (Math.abs(this.x - pos.x * BLOCK_SIZE) < BLOCK_SIZE && Math.abs(this.y - pos.y * BLOCK_SIZE) < BLOCK_SIZE) {
                    // 扉を開ける
                    data.openDoor();
                    this.lostItem(KEY_ITEM);
                }
            }
            if (this.x % BLOCK_SIZE === 0 && this.y % BLOCK_SIZE === 0) {
                if (data.isDoorOpen()) {
                    const pos = data.getDoorPos();
                    if (pos.x === this.x / BLOCK_SIZE && pos.y === this.y / BLOCK_SIZE) {
                        // クリアした
                        this.dir = 1;
                        data.setPlayMode(PlayMode.ClearWait);
                        return;
                    }
                } else {
                    const pos = data.getKeyPos();
                    if (pos.x === this.x / BLOCK_SIZE && pos.y === this.y / BLOCK_SIZE && !this.hasItem(KEY_ITEM)) {
                        // 鍵を取った
                        this.chimeCount = 0;
                        setChime(2);
                        this.gotItem(KEY_ITEM);
                        playEffect('KeyGet').then();
                    }
                }
                // 宝
                if (data.getTreasure() === 1) {
                    const pos = data.getTreasurePos();
                    if (pos.x === this.x / BLOCK_SIZE && pos.y === this.y / BLOCK_SIZE) {
                        // 宝を取った
                        let ok = true;
                        if (data.isStageFlag(STAGE_LOCK)) {
                            if (this.hasItem(POTION_OF_UNLOCK)) {
                                this.lostItem(POTION_OF_UNLOCK);
                            } else {
                                ok = false;
                            }
                        }
                        if (ok) {
                            playEffect('ItemGet').then();
                            data.setTreasure(0);
                            // potion of deathは、次にスタートした時から有効, キュアで消えない
                            // potion of cureはdeath状態だった場合はその場限りで直す
                            if (data.getTreasureItem() === POTION_OF_CURE && data.isStageFlag(STAGE_DEATH)) {
                                data.clearStageFlag(STAGE_DEATH);
                            } else {
                                this.gotItem(data.getTreasureItem());
                            }
                            this.initMattock(1);
                        }
                    }
                }
            }
        }
        // Chimeのチェック
        this.chimeDir = 0;
        if (this.chimeCount > 0) {
            const pos = data.getKeyPos();
            if (pos.x * BLOCK_SIZE > this.x && this.dir === 2) {
                // 右にある
                this.chimeDir = 1;
                setChime(1);
            } else if (pos.x * BLOCK_SIZE < this.x && this.dir === 4) {
                // 左にある
                this.chimeDir = -1;
                setChime(1);
            } else {
                setChime(2);
            }
            if (this.chimeDir !== 0) {
                this.chimeCount--;
            }
        }
        if (this.swordMode === 1) {
            if (this.swordCount < SWORD_MIDDLE) {
                this.swordCount = Math.min(this.swordCount + this.swordSpeed, SWORD_MIDDLE);
            }
        } else if (this.swordMode === 2) {
            if (this.swordCount === SWORD_MIDDLE) {
                playEffect('SwordEnd').then();
            }
            this.swordCount += this.swordSpeed;
            if (this.swordCount >= SWORD_END) {
                this.swordCount = 0;
                this.swordMode = 0;
            }
        }
        if (this.stick.isSword()) {
            if (this.swordMode === 0) {
                // 剣を出し始める
                if (this.x % BLOCK_SIZE === 0 && this.y % BLOCK_SIZE === 0 && !this.walkFlag) {
                    // マトック
                    if (this.restMattock > 0) {
                        const blk = data.breakWall(this.x / BLOCK_SIZE, this.y / BLOCK_SIZE, this.dir, 'Gil');
                        if (blk === 1) {
                            // 壁を壊した
                            /*
                            data.addEvent({
                                type: 'Break',
                                value: 'Gil'
                            });
                            */
                            if (data.isLastFloor()) {
                                data.setPlayMode(PlayMode.ZapWait);
                                return;
                            }
                        }
                        this.restMattock -= blk;
                        if (this.restMattock <= 0) {
                            this.restMattock = 0;
                            this.lostItem(MATTOCK_ITEM);
                        }
                    }
                }
                if (this.swordSpeed > 0) {
                    playEffect('SwordStart').then();
                    this.swordMode = 1;
                    this.swordCount = 1;
                }
            }
        } else if (this.swordMode === 1) {
            this.swordMode = 2;
        }
        // ドラゴンの炎
        for (let fire of data.getFireList()) {
            let rect: HitRect;
            let sx = fire.bx * BLOCK_SIZE;
            let sy = fire.by * BLOCK_SIZE;
            switch (fire.dir) {
                case 1:
                    rect = new HitRect(sx, sy - fire.length * BLOCK_SIZE, sx + 16, sy);
                    break;
                case 2:
                    rect = new HitRect(sx + 16, sy, sx + 16 + fire.length * BLOCK_SIZE, sy + 16);
                    break;
                case 3:
                    rect = new HitRect(sx, sy + 16, sx + 16, sy + 16 + fire.length * BLOCK_SIZE);
                    break;
                case 4:
                    rect = new HitRect(sx - fire.length * BLOCK_SIZE, sy, sx, sy + 16);
                    break;
            }
            if (rect!.isHit(this.x + 7, this.y + 7) && this.getItem(NECKLACE_ITEM) < 3) {
                this.addHP(-this.hitPoint);
            }
        }
        if (this.resetState) {
            this.recalcState(gl);
        }
    }

    public getDrawData(): {
        x: number;
        y: number;
        foot: number;
        body: number;
    } {
        let fix = ((this.footCount & 4) ? 1 : 0);
        let ix = this.getSwordIndex();
        if (ix > 4) {
            // しまい始めている
            ix = 9 - ix;
        } else if (ix > 0) {
            ix++;
        } else {
            ix = fix;
        }
        //ix = 5;
        return {
            x: (this.x + 0) / BLOCK_SIZE,
            y: (this.y + 0) / BLOCK_SIZE,
            foot: (this.dir - 1) * 2 + fix,
            body: (this.dir - 1) * 6 + ix
        };
    }

    public getBodyPos(): { x: number; y: number; } {
        return {
            x: this.x + 7,
            y: this.y + 7
        };
    }
    /**
     * 剣の状態
     * @returns 0:しまっている, 1-3:抜きはじめ, 4:突き出している, 5-7:とじはじめ
     */
    public getSwordIndex(): number {
        if (this.swordCount === 0) {
            return 0;
        }
        const div = SWORD_MIDDLE / 4;
        return Math.floor((this.swordCount - 1) / div) + 1;
    }
    /**
     * 剣を押しているモード
     * @returns 0:しまっている,1:出している,2:しまい始めている
     */
    public getSwordMode(): number {
        return this.swordMode;
    }
    public getAttackRect(): HitRect | null {
        const ix = this.getSwordIndex();
        if (ix > 2 && ix < 6) {
            let sx = this.x + 1;
            let sy = this.y + 1;
            let ex = this.x + 15;
            let ey = this.y + 15;
            if (ix === 4) {
                switch (this.dir) {
                    case 1:
                        // 上
                        sy -= 4;
                        ey -= 4;
                        break;
                    case 2:
                        // 右
                        sx += 3;
                        ex += 3;
                        break;
                    case 3:
                        // 下
                        sy += 3;
                        ey += 3;
                        break;
                    case 4:
                        // 左
                        sx -= 3;
                        ex -= 3;
                        break;
                }
            }
            return new HitRect(sx, sy, ex, ey);
        }
        return null;
    }
    public getShieldRect(): { rect: HitRect; dir: number; } | null {
        let sx = this.x - 2;
        let sy = this.y - 2;
        let ex = this.x + 18;
        let ey = this.y + 18;
        const shld = this.getItem(SHIELD_ITEM);
        if (shld > 0) {
            // 広げる
            sx -= 5;
            sy -= 5;
            ex += 5;
            ey += 5;
            if (shld > 1) {
                sx -= 4;
                sy -= 4;
                ex -= 4;
                ey -= 4;
            }
        } else if (shld === 0) {
            // 狭くなる
            sx++;
            sy++;
            ex--;
            ey--;
        }
        let dir = this.dir;
        const swix = this.getSwordIndex();
        if (swix > 0) {
            if (swix >= 3 && swix <= 5) {
                // 剣を出している
                dir = ((dir + 2) % 4) + 1;
            } else {
                return null;
            }
        }
        switch (dir) {
            case 1:
                sx = this.x + 4;
                ex = this.x + 12;
                ey = this.y + 2;
                break;
            case 2:
                sy = this.y + 4;
                ey = this.y + 12;
                sx = this.x + 14;
                break;
            case 3:
                sx = this.x + 4;
                ex = this.x + 12;
                sy = this.y + 14;
                break;
            case 4:
                sy = this.y + 4;
                ey = this.y + 12;
                ex = this.x + 2;
                break;
        }
        return { rect: new HitRect(sx, sy, ex, ey), dir: dir };
    }
    public gotItem(name: string): void {
        // balanceが必要なアイテム
        const balanceItem = [SWORD_END + ':3', SHIELD_ITEM + ':2', ARMOR_ITEM + ':2', GUNTLET_ITEM + ':2', HELMET_ITEM + ':1'];
        let dt = name.split(':');
        if (dt[0] === DUMMY_ITEM) {
            return;
        } else if (dt[0] === 'GIL') {
            // Gilの増減
            const add = parseInt(dt[1]);
            if (add < 0) {
                // ロスト
                this.hitPoint = 0;
            } else {
                this.resetPlayer += add;
            }
            return;
        }
        if (balanceItem.includes(name)) {
            if (!this.hasItem(BALANCE_ITEM)) {
                this.evilMap[dt[0]] = true;
            } else {
                this.lostItem(BALANCE_ITEM);
            }
        }
        if (name === ROD_ITEM + ':*') {
            // 特別に偽のブルークリスタルロッド
            dt = [ROD_ITEM, '4'];
            this.evilMap[dt[0]] = true;
            this.drawItemList.push(this.getItemIndex(ROD_ITEM + ':4'));
        }
        this.resetState = [BOOTS_ITEM, SWORD_ITEM, GUNTLET_ITEM, ARMOR_ITEM, HELMET_ITEM, SHIELD_ITEM].indexOf(dt[0]) >= 0;
        let val = 1;
        if (dt.length > 1) {
            val = parseInt(dt[1]);
        }
        if (dt[0] === ROD_ITEM || dt[0] === BALANCE_ITEM) {
            // フラグ
            this.itemMap[dt[0]] = (this.itemMap[dt[0]] || 0) | val;
        } else {
            this.lostItem(dt[0]);
            this.itemMap[dt[0]] = val;
        }
        if (name === POTION_OF_ENEGY_DRAIN) {
            this.hitPoint = 16;
        } else if (name === POTION_OF_POWER) {
            this.hitPoint += 48;
        }
        let ix = this.getItemIndex(name);
        if (name === KEY_ITEM) {
            // 鍵
            this.drawItemList[0] = ix;
        } else {
            if (this.drawItemList[1] >= 0) {
                // 空いているところに追加する
                for (let i = 2; i < this.drawItemList.length; i++) {
                    if (this.drawItemList[i] < 0) {
                        this.drawItemList[i] = this.drawItemList[1];
                        break;
                    }
                }
            }
            this.drawItemList[1] = ix;
        }
    }
    public lostItem(name: string): void {
        const dt = name.split(':');
        let val = this.getItem(dt[0]);
        if (val < 0) {
            return;
        }
        if (dt[0] === ROD_ITEM) {
            // フラグ
            if (dt.length > 1) {
                val &= ~parseInt(dt[1]);
            }
            if (val > 0) {
                this.itemMap[dt[0]] = val;
                for (let i = 0; i < this.drawItemList.length; i++) {
                    const ix = this.drawItemList[i];
                    if (ix < 0) {
                        continue;
                    }
                    if (itemIndexList[ix] === name) {
                        this.drawItemList[i] = -1;
                        break;
                    }
                }
                if ((val & 4) === 0) {
                    // ブルークリスタルロッドの分は削除
                    delete this.evilMap[ROD_ITEM];
                }
                return;
            }
        } else if (dt.length > 1) {
            // 指定したものだけを削除する
            if (val !== parseInt(dt[1])) {
                return;
            }
        }
        for (let i = 0; i < this.drawItemList.length; i++) {
            const ix = this.drawItemList[i];
            if (ix < 0) {
                continue;
            }
            if (itemIndexList[ix].startsWith(dt[0])) {
                this.drawItemList[i] = -1;
                break;
            }
        }
        delete this.itemMap[dt[0]];
        delete this.evilMap[dt[0]];
    }
    /**
     * 
     * @param name 
     * @returns -1: 持っていない, 0:イビルアイテム
     */
    public getItem(name: string): number {
        if (name in this.itemMap) {
            if (name !== ROD_ITEM && name in this.evilMap) {
                return 0;
            }
            return this.itemMap[name];
        }
        return -1;
    }
    public isEvil(name: string): boolean {
        return name in this.evilMap;
    }
    public hasItem(name: string, upper = false): boolean {
        const dt = name.split(':');
        let num = this.getItem(dt[0]);
        if (num < 0) {
            return false;
        }
        if (dt.length === 1) {
            return true;
        }
        const val = parseInt(dt[1]);
        if (dt[0] === ROD_ITEM || dt[0] === BALANCE_ITEM) {
            // フラグ
            return (num & val) > 0;
        } else if (dt[0] === POTION_ITEM) {
            // ポーションは個別
            return num === val;
        }
        if (upper && dt[0] in this.evilMap) {
            // イビルアイテムは最上位
            return true;
        }
        // 上位を持っていればいい
        return num === val || (upper && num >= val);
    }
    public getItemIndex(name: string): number {
        const dt = name.split(':');
        if (dt[0] === BALANCE_ITEM) {
            name = BALANCE_ITEM;
        }
        for (let i = 0; i < itemIndexList.length; i++) {
            if (itemIndexList[i] === name) {
                return i;
            }
        }
        return -1;
    }
}

/**
 * ドラゴンの炎のデータ
 */
export interface DragonFire {
    bx: number;
    by: number;
    dir: number;
    length: number; // 横なら最大5, 縦なら最大3, -1で終了する
}

/**
 * 壁が見えない
 */
export const STAGE_DARK = 1;
/**
 * ゴーストが見えない
 */
export const STAGE_HIDDEN_GHOST = 2;
/**
 * 鍵が見えない
 */
export const STAGE_HIDDEN_KEY = 4;
/**
 * 扉が見えない
 */
export const STAGE_HIDDEN_DOOR = 8;
/**
 * タイムの減りが早くなる
 */
export const STAGE_DEATH = 16;
/**
 * 宝箱をロックする
 */
export const STAGE_LOCK = 32;
/**
 * ドルアーガを倒した
 */
export const STAGE_KILL_DRUAGA = 64;
/**
 * スライムが見えない
 */
export const STAGE_HIDDEN_SLIME = 128;
/**
 * ステージが時々変わる
 * 2intで10減る(globalCounter?)
 * 18780 or 18800
 * 17520
 */
export const STAGE_CHANGE_WALL = 256;

/**
 * プラチナマトックでのみ壊せる
 */
export const STAGE_WALL2 = 512;

export class StageData {
    /**
     * 壁の方向： 1:上, 2:右, 3:下, 4:左, 0:壁が壊れた
     */
    private wallData: number[][];

    private spriteMap: { [key: string]: SpriteData } = {};

    private enemyList: EnemyData[] = [];

    private playMode: PlayMode;

    /**
     * 1フレームでのイベント
     */
    private eventList: EventData[] = [];

    /**
     * 宝のフラグ
     * 0: 出ていない
     * 1: 取れる
     * 2: ロック
     */
    private treasureFlag: number = 0;

    /**
     * 20000からスタート
     * 2 frame で 10 減る
     * 60以下だと 62frameで 1 減る
     * 黒い薬: 2frameで60減らす, 60以下だと 6frameで 1 減らす
     */
    private timer: number = 0;
    /**
     * 赤字タイム
     */
    private redTime: boolean = false;
    private intCount: number = 1;

    /**
     * １フレームごとのカウンタ
     * Playing: 256で0に戻るカウンタ
     * それ以外はカウントダウン
     */
    private globalCounter: number = 0;

    private playerPos: { x: number; y: number; };

    private doorPos: { x: number; y: number; };

    private keyPos: { x: number; y: number; };

    private doorOpenFlag: boolean = false;

    /**
     * 宝のアイテム
     */
    private treasureItem: string = "";

    /**
     * 宝のイベント
     */
    private treasureEvent?: EventBase;

    /**
     * ドラゴンの炎
     */
    private dragonFire: (() => DragonFire)[] = [];

    /**
     * 返却用
     */
    private fireResult: DragonFire[] = [];

    /**
     * フラグ
     */
    private stageFlag: number = 0;

    /**
     * フロアの初期化やクリア後の処理
     */
    private floorInit: FloorInitBase[] = [];

    /**
     * イベントの進捗表示用
     */
    private flashData?: {
        type: number;
        count: number;
    };

    /**
     * 壁が次々変わる場合のインデックス
     */
    private changeWallIndex = 0;
    private initWallData: string[] = [];

    public constructor(public readonly playerData: PlayerData, public readonly floorNum: number) {
        this.playMode = PlayMode.StarWait;
        this.playerPos = { x: this.nextInt(FLOOR_WIDTH), y: this.nextInt(FLOOR_HEIGHT) };
        do {
            this.doorPos = { x: this.nextInt(FLOOR_WIDTH), y: 0 };
        } while (this.playerPos.x === this.doorPos.x && this.playerPos.y === this.doorPos.y);
        do {
            this.keyPos = { x: this.nextInt(FLOOR_WIDTH), y: this.nextInt(FLOOR_HEIGHT) };
        } while ((this.playerPos.x === this.keyPos.x && this.playerPos.y === this.keyPos.y) || (this.doorPos.x === this.keyPos.x && this.doorPos.y === this.keyPos.y));

        this.wallData = [
            [2, 3, 4, 2, 3, 1, 2, 3, 4, 4, 4, 4, 4, 3, 3, 1, 2],
            [2, 3, 4, 2, 3, 1, 2, 3, 4, 4, 4, 4, 4, 3, 3, 1, 2],
            [2, 3, 4, 2, 3, 1, 2, 3, 4, 4, 4, 4, 4, 3, 3, 1, 2],
            [2, 3, 4, 2, 3, 1, 2, 3, 4, 4, 4, 4, 4, 3, 3, 1, 2],
            [2, 3, 4, 2, 3, 1, 2, 3, 4, 4, 4, 4, 4, 3, 3, 1, 2],
            [2, 3, 4, 2, 3, 1, 2, 3, 4, 4, 4, 4, 4, 3, 3, 1, 2],
            [2, 3, 4, 2, 3, 1, 2, 3, 4, 4, 4, 4, 4, 3, 3, 1, 2],
            [2, 3, 4, 2, 3, 1, 2, 3, 4, 4, 4, 4, 4, 3, 3, 1, 2],
            []
        ];
    }
    public addEvent(event: EventData): void {
        this.eventList.push(event);
        //console.log("EVENT", event);
    }
    public addDragonFire(fire: () => DragonFire): void {
        this.dragonFire.push(fire);
    }

    public randomPos(): { x: number; y: number } {
        const pos = this.playerData.getPosition();
        while (true) {
            let x = this.nextInt(FLOOR_WIDTH);
            let y = this.nextInt(FLOOR_HEIGHT);
            if (Math.abs(pos.x - x * BLOCK_SIZE) + Math.abs(pos.y - y * BLOCK_SIZE) > 2 * BLOCK_SIZE) {
                return {
                    x: x,
                    y: y
                };
            }
        }
    }

    public nextInt(num: number): number {
        return Math.floor(Math.random() * num);
    }

    /**
     * 壁を壊す
     * @param bx 
     * @param by 
     * @param dir 
     * @param src
     * @returns 0: 壊す必要なし, 1:壊した,  255: 外壁でマトックが壊れる
     */
    public breakWall(bx: number, by: number, dir: number, src: string): number {
        const proc = () => {
            if (this.isStageFlag(STAGE_WALL2) && src === 'Gil') {
                // プラチナマトックのみ
                if (!this.playerData.hasItem(MATTOCK_ITEM + ':4')) {
                    return 0;
                }
            }
            playEffect('Break').then();
            this.addEvent({
                type: 'Break',
                value: {
                    x: bx,
                    y: by,
                    dir: dir,
                    src: src
                }
            });
            return 1;
        };
        switch (dir) {
            case 1: // 上
                if (by === 0) {
                    return 255;
                } else if (bx < FLOOR_WIDTH - 1 && this.wallData[by - 1][bx] === 4) {
                    this.wallData[by - 1][bx] = 0;
                    return proc();
                } else if (bx > 0 && this.wallData[by - 1][bx - 1] === 2) {
                    this.wallData[by - 1][bx - 1] = 0;
                    return proc();
                }
                break;
            case 2: // 右
                if (bx >= FLOOR_WIDTH - 1) {
                    return 255;
                } else if (by < FLOOR_HEIGHT - 1 && this.wallData[by][bx] === 1) {
                    this.wallData[by][bx] = 0;
                    return proc();
                } else if (by > 0 && this.wallData[by - 1][bx] === 3) {
                    this.wallData[by - 1][bx] = 0;
                    return proc();
                }
                break;
            case 3: // 下
                if (by >= FLOOR_HEIGHT - 1) {
                    return 255;
                } else if (bx < FLOOR_WIDTH - 1 && this.wallData[by][bx] === 4) {
                    this.wallData[by][bx] = 0;
                    return proc();
                } else if (bx > 0 && this.wallData[by][bx - 1] === 2) {
                    this.wallData[by][bx - 1] = 0;
                    return proc();
                }
                break;
            case 4: // 左
                if (bx === 0) {
                    return 255;
                } else if (by < FLOOR_HEIGHT - 1 && this.wallData[by][bx - 1] === 1) {
                    this.wallData[by][bx - 1] = 0;
                    return proc();
                } else if (by > 0 && this.wallData[by - 1][bx - 1] === 3) {
                    this.wallData[by - 1][bx - 1] = 0;
                    return proc();
                }
                break;
        }
        return 0;
    }

    public isDoorOpen(): boolean {
        return this.doorOpenFlag;
    }
    public openDoor(): void {
        this.doorOpenFlag = true;
    }
    public setTreasure(num: number): void {
        this.treasureFlag = num;
    }
    /**
     * 宝が出ているか
     * @returns 0:出ていない,1:取れる,2:ロック
     */
    public getTreasure(): number {
        return this.treasureFlag;
    }
    public getTimer(): number {
        return this.timer;
    }
    public isRedTime(): boolean {
        return this.redTime;
    }
    private lastFlag = false;
    public setLastFloor(): void {
        this.stageFlag |= (STAGE_HIDDEN_DOOR | STAGE_HIDDEN_KEY);
        this.keyPos.x = -1;
        this.lastFlag = true;
    }
    public isLastFloor(): boolean {
        return this.lastFlag;
    }
    public getFlash(): { type: number; count: number; } | undefined {
        return this.flashData;
    }
    protected makeWall(data: string[], startY = 0): void {
        this.wallData = [];
        for (let y = 0; y < FLOOR_HEIGHT; y++) {
            if (y + startY >= data.length) {
                break;
            }
            const dt = data[y + startY];
            let row: number[] = [];
            for (let i = 0; i < FLOOR_WIDTH - 1; i++) {
                if (i < dt.length) {
                    row[i] = parseInt(dt.charAt(i));
                } else {
                    row[i] = 0;
                }
            }
            this.wallData.push(row);
        }
        while (this.wallData.length < FLOOR_HEIGHT - 1) {
            this.wallData.push([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
        }
    }
    public initStage(gl: WebGL2RenderingContext, data: Stage): void {
        setChime(0);
        this.initWallData = data.data;
        this.changeWallIndex = 0;
        this.timer = 20000;
        this.redTime = false;
        this.flashData = undefined;
        this.stageFlag = 0;
        this.playMode = PlayMode.StarWait;
        this.eventList = [];
        this.dragonFire = [];
        this.fireResult = [];
        this.intCount = 2;
        this.treasureItem = data.treasure;
        this.treasureFlag = 0;
        this.globalCounter = 60;
        this.doorOpenFlag = false;
        if (this.playerData.hasItem(POTION_OF_DEATH)) {
            this.stageFlag |= STAGE_DEATH;
        }
        this.playerData.lostItem(KEY_ITEM);
        if (!data.treasure || this.playerData.hasItem(data.treasure, true)) {
            this.treasureEvent = undefined;
        } else {
            this.treasureEvent = parseEvent(data.event);
            if (data.treasure === KEY_ITEM) {
                this.keyPos.x = -10;
            }
        }
        this.enemyList = [];
        this.playerData.init(gl, this.playerPos.x, this.playerPos.y);
        this.makeWall(data.data);
        for (let ene of data.enemy) {
            let dt = ene.split('*');
            if (dt[0] in enemyCreateMap) {
                const num = parseInt(dt[1] || "1");
                enemyCreateMap[dt[0]](gl, this, dt[0], num);
            } else {
                console.log("Unknown Enemy", ene);
            }
        }
        if (this.treasureEvent) {
            this.treasureEvent.init(gl, this);
        }
        // 
        if (this.playerData.hasItem(POTION_OF_DEATH)) {
            // フラグをつける
            this.setStageFlag(STAGE_DEATH);
        }
        // ステージ初期化
        this.floorInit = [];
        for (let init of data.init) {
            const dt = floorInitMap[init];
            if (dt) {
                const obj: FloorInitBase = new dt();
                this.floorInit.push(obj);
            } else {
                console.log("Unknown Init Event", init);
            }
        }
        this.floorInit.forEach(init => init.init(gl, this));
    }
    public setStageFlag(flag: number): void {
        this.stageFlag |= flag;
    }
    public clearStageFlag(flag: number): void {
        this.stageFlag &= ~flag;
    }
    public isStageFlag(flag: number): boolean {
        return (this.stageFlag & flag) === flag;
    }
    public setTreasureItem(item: string): void {
        this.treasureItem = item;
    }
    public getTreasureItem(): string {
        return this.treasureItem;
    }

    public getGlobalCount(): number {
        return this.globalCounter;
    }
    public getEnemyList(): EnemyData[] {
        return this.enemyList;
    }
    public getKeyPos(): { x: number; y: number; } {
        return this.keyPos;
    }
    public getDoorPos(): { x: number; y: number; } {
        return this.doorPos;
    }
    public setDoorPos(x: number, y: number): void {
        this.doorPos.x = x;
        this.doorPos.y = y;
    }
    public getTreasurePos(): { x: number; y: number; } {
        return this.playerPos;
    }

    public getSprite(gl: WebGL2RenderingContext, fname: string): SpriteData {
        if (!(fname in this.spriteMap)) {
            this.spriteMap[fname] = new SpriteData(gl, fname);
        }
        return this.spriteMap[fname];
    }

    public close(gl: WebGL2RenderingContext): void {
        for (let key in this.spriteMap) {
            this.spriteMap[key].close(gl);
        }
        this.spriteMap = {};
    }

    /**
     * 描画する壁の一覧
     * @returns type: 1=縦, 2=横
     */
    public getWall(): { x: number; y: number; type: number }[] {
        let ret: { x: number; y: number; type: number }[] = [];
        for (let y = 0; y < this.wallData.length; y++) {
            for (let x = 0; x < this.wallData[y].length; x++) {
                const dt = this.wallData[y][x];
                if (dt === 1) {
                    // 上
                    ret.push({ x: x + 1, y: y, type: 1 });
                } else if (dt === 2) {
                    // 右
                    ret.push({ x: x + 1, y: y + 1, type: 2 });
                } else if (dt === 3) {
                    // 下
                    ret.push({ x: x + 1, y: y + 1, type: 1 });
                } else if (dt === 4) {
                    // 左
                    ret.push({ x: x, y: y + 1, type: 2 });
                }
            }
        }
        return ret;
    }

    public addEnemy(enemy: EnemyData): void {
        //console.log("Add Enemy", enemy);
        this.enemyList.push(enemy);
    }
    public removeEnemy(enemy: EnemyData): void {
        for (let i = 0; i < this.enemyList.length; i++) {
            if (this.enemyList[i] === enemy) {
                this.enemyList.splice(i, 1);
                enemy.removed = true;
                break;
            }
        }
    }

    public setPlayMode(mode: PlayMode): void {
        const overLostItem = [POTION_OF_DEATH, POTION_OF_ENEGY_DRAIN, POTION_OF_POWER];
        const clearLostItem = [POTION_OF_ENEGY_DRAIN, POTION_OF_POWER];
        this.playMode = mode;
        switch (mode) {
            case PlayMode.AllClear:
                this.globalCounter = 258;
                playBgm('FloorEnd', 1).then();
                break;
            case PlayMode.ZapWait:
                this.globalCounter = 200;
                playBgm('Miss', 1).then();
                break;
            case PlayMode.LostWait:
                this.globalCounter = 200;
                // 消えるアイテム
                for (let itm of overLostItem) {
                    this.playerData.lostItem(itm);
                }
                playBgm("Miss", 1).then();
                break;
            case PlayMode.ClearWait:
            case PlayMode.ReturnWait:
                this.globalCounter = 360;
                for (let itm of clearLostItem) {
                    this.playerData.lostItem(itm);
                }
                this.floorInit.forEach(init => init.clear(this));
                if (this.playMode === PlayMode.ClearWait || this.playMode === PlayMode.ReturnWait) {
                    // BGM
                    playBgm('FloorClear', 1).then();
                }
                break;
            default:
                this.globalCounter = 300;
                break;
        }
    }
    public getPlayMode(): PlayMode {
        return this.playMode;
    }
    /**
     * ドラゴンの炎リスト
     * @returns 
     */
    public getFireList(): DragonFire[] {
        return this.fireResult;
    }

    public stepFrame(gl: WebGL2RenderingContext): void {
        if (this.flashData) {
            this.flashData.count--;
            if (this.flashData.count < 0) {
                this.flashData = undefined;
            }
        }
        if (this.playMode !== PlayMode.Playing) {
            if (this.globalCounter > 0) {
                this.globalCounter--;
                if (this.playMode === PlayMode.StarWait && this.globalCounter === 0) {
                    this.playMode = PlayMode.Playing;
                    // ランダムにする
                    this.globalCounter = Math.floor(Math.random() * 256);
                }
            }
            return;
        }
        this.intCount--;
        if (this.intCount === 0) {
            if (!this.redTime) {
                // POTION:6 があると減るのが早くなる
                if (this.stageFlag & STAGE_DEATH) {
                    this.timer -= 60;
                } else {
                    this.timer -= 10;
                }
                this.intCount = 2;
                if (this.timer < 60) {
                    this.timer = 60;
                    this.intCount = 62;
                    this.redTime = true;
                    if (timerProc) {
                        timerProc(gl, this);
                    }
                }
            } else {
                this.timer--;
                if (this.stageFlag & STAGE_DEATH) {
                    this.intCount = 6;
                } else {
                    this.intCount = 62;
                }
                if (this.timer < 0) {
                    // 終了
                    this.timer = 0;
                    if (this.lastFlag) {
                        this.setPlayMode(PlayMode.ZapWait);
                    } else {
                        this.setPlayMode(PlayMode.LostWait);
                    }
                    return;
                }
                if (timerProc) {
                    timerProc(gl, this);
                }
            }
        }
        // ドラゴンの炎
        this.fireResult = [];
        for (let i = 0; i < this.dragonFire.length; i++) {
            let dt = this.dragonFire[i]();
            if (dt.length < 0) {
                // 終了
                this.dragonFire.splice(i, 1);
                i--;
            } else {
                this.fireResult.push(dt);
            }
        }
        this.playerData.stepNext(gl, this);
        if (this.playMode !== PlayMode.Playing) {
            return;
        }
        let enelist = [...this.enemyList];
        enelist.forEach(e => {
            e.stepFrame(gl, this);
        });
        if (this.playMode !== PlayMode.Playing) {
            return;
        }
        if (this.playerData.getHP() === 0) {
            this.setPlayMode(PlayMode.LostWait);
        } else {
            if (this.treasureEvent) {
                const res = this.treasureEvent.checkEvent(this, this.eventList);
                if (res === EventResult.NG) {
                    // 宝失敗
                    this.treasureEvent = undefined;
                    this.flashData = {
                        type: -1,
                        count: 100
                    };
                    playEffect('EventNG').then();
                } else if (res === EventResult.OK || res === EventResult.Hold) {
                    // 宝が出る
                    if (this.isLastFloor()) {
                        // Clear
                        this.setPlayMode(PlayMode.AllClear);
                        return;
                    } else {
                        this.treasureFlag = 1;
                        this.flashData = {
                            type: 1,
                            count: 100
                        };
                        playEffect('EventOK').then();
                    }
                    this.treasureEvent = undefined;
                } else if (res === EventResult.Next) {
                    this.flashData = {
                        type: 0,
                        count: 60
                    };
                    playEffect('EventNEXT').then();
                }
            }
            this.eventList = [];
            this.globalCounter = (this.globalCounter + 1) & 255;
            if ((this.stageFlag & STAGE_CHANGE_WALL) && this.globalCounter === 0) {
                // 壁を変化させる
                let ny = (this.changeWallIndex + FLOOR_HEIGHT) % this.initWallData.length;
                if (ny !== this.changeWallIndex) {
                    this.changeWallIndex = ny;
                    this.makeWall(this.initWallData, ny);
                }
            }
        }
    }

    public canMove(bx: number, by: number, ax: number, ay: number): boolean {
        if (ax < 0) {
            // 左側
            if (bx === 0) {
                return false;
            }
            if (by > 0) {
                if (this.wallData[by - 1][bx - 1] === 3) {
                    return false;
                }
            }
            if (by < FLOOR_HEIGHT - 1) {
                if (this.wallData[by][bx - 1] === 1) {
                    return false;
                }
            }
        } else if (ax > 0) {
            // 右側
            if (bx === FLOOR_WIDTH - 1) {
                return false;
            }
            if (by > 0) {
                if (this.wallData[by - 1][bx] === 3) {
                    return false;
                }
            }
            if (by < FLOOR_HEIGHT - 1) {
                if (this.wallData[by][bx] === 1) {
                    return false;
                }
            }
        } else if (ay < 0) {
            // 上側
            if (by === 0) {
                return false;
            }
            if (bx > 0) {
                if (this.wallData[by - 1][bx - 1] === 2) {
                    return false;
                }
            }
            if (bx < FLOOR_WIDTH - 1) {
                if (this.wallData[by - 1][bx] === 4) {
                    return false;
                }
            }
        } else if (ay > 0) {
            // 下側
            if (by === FLOOR_HEIGHT - 1) {
                return false;
            }
            if (bx > 0) {
                if (this.wallData[by][bx - 1] === 2) {
                    return false;
                }
            }
            if (bx < FLOOR_WIDTH - 1) {
                if (this.wallData[by][bx] === 4) {
                    return false;
                }
            }
        }
        return true;
    }
}

export function setTimerProc(proc: (gl: WebGL2RenderingContext, data: StageData) => void): void {
    timerProc = proc;
}