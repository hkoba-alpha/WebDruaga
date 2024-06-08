import { DummyExit } from "./Enemy";
import { ARMOR_ITEM, BOOK_ITEM, CANDLE_ITEM, FloorInit, FloorInitBase, GUNTLET_ITEM, POTION_ITEM, POTION_OF_CURE, POTION_OF_UNLOCK, PlayMode, SHIELD_ITEM, STAGE_DARK, STAGE_HIDDEN_DOOR, STAGE_HIDDEN_KEY, STAGE_KILL_DRUAGA, STAGE_LOCK, SWORD_ITEM, StageData } from "./StageData";

@FloorInit("Candle")
class CandleInit extends FloorInitBase {
    public clear(data: StageData): void {
        data.playerData.lostItem(CANDLE_ITEM + ':1');
    }
}

@FloorInit("Lock")
class LockInit extends FloorInitBase {
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        data.setStageFlag(STAGE_LOCK);
    }
}

@FloorInit("LockEnd")
class LockEndInit extends FloorInitBase {
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        data.clearStageFlag(STAGE_LOCK);
    }
}

@FloorInit("Dark")
class DarkInit extends FloorInitBase {
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        if (data.playerData.getItem(BOOK_ITEM) < 1) {
            data.setStageFlag(STAGE_DARK);
        }
    }
}

@FloorInit("Dark2")
class Dark2Init extends FloorInitBase {
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        if (data.playerData.getItem(BOOK_ITEM) < 2) {
            data.setStageFlag(STAGE_DARK);
        }
    }
}

@FloorInit("Exit")
class ExitInit extends Dark2Init {
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        if (data.playerData.getItem(BOOK_ITEM) < 3) {
            data.setStageFlag(STAGE_HIDDEN_DOOR);
        }
        super.init(gl, data);
    }
}

@FloorInit("Key")
class KeyInit extends ExitInit {
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        if (data.playerData.getItem(BOOK_ITEM) < 4) {
            data.setStageFlag(STAGE_HIDDEN_KEY);
        }
        super.init(gl, data);
    }
}

@FloorInit("ClearPotion")
class ClearPotionInit extends FloorInitBase {
    public clear(data: StageData): void {
        data.playerData.lostItem(POTION_ITEM);
    }
}

@FloorInit("Cure")
class CureInit extends FloorInitBase {
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        data.setTreasureItem(POTION_OF_CURE);
    }
}


@FloorInit("Druaga")
class DruagaInit extends FloorInitBase {
    public clear(data: StageData): void {
        if (!data.isStageFlag(STAGE_KILL_DRUAGA)) {
            // 装備を取る
            data.playerData.lostItem(SWORD_ITEM);
            data.playerData.lostItem(SHIELD_ITEM);
            data.playerData.lostItem(ARMOR_ITEM);
            data.setPlayMode(PlayMode.ZapWait);
        }
    }
}

@FloorInit("Last")
class LastInit extends FloorInitBase {
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        data.setStageFlag(STAGE_HIDDEN_DOOR);
        data.setStageFlag(STAGE_HIDDEN_KEY);
        data.setLastFloor();
    }
}

@FloorInit("Choice")
class ChoiceInit extends FloorInitBase {
    public init(gl: WebGL2RenderingContext, data: StageData): void {
        let dx = Math.floor(Math.random() * 8) + 5;
        for (let x = 5; x < 13; x++) {
            if (x === dx) {
                data.setDoorPos(x, 0);
            } else {
                const ene = new DummyExit("DummyExit", data.getSprite(gl, "stage"));
                ene.init(x, 0);
                data.addEnemy(ene);
            }
        }
    }
}