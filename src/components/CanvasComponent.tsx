// src/components/CanvasComponent.tsx

import 'bootstrap/dist/css/bootstrap.min.css';
import React, { useRef, useEffect, useState } from 'react';
import { Button, Card, Col, Container, Form, Modal, Row, Table } from 'react-bootstrap';
import { ArrowLeft, ArrowRight, ArrowUp, ArrowDown, CardList, CaretRight, BoxArrowInDownLeft } from 'react-bootstrap-icons';
import { IPlay, KeyboardStick, ButtonType, saveData, GamepadStick } from '../services/PlayData';
import { TitlePlay } from '../services/TitlePlay';
import { setBgmVolumeLevel, setEffectVolumeLevel } from '../services/SoundData';

interface CanvasComponentProps {
  // ここに必要なプロパティを追加
}

const keyConfigIndex = [
  ButtonType.Up,
  ButtonType.Left,
  ButtonType.Down,
  ButtonType.Right,
  ButtonType.Select,
  ButtonType.Pause,
  ButtonType.Sword,
];

let stick: KeyboardStick = new KeyboardStick();
let playing = true;
let context: WebGL2RenderingContext;
let playData: IPlay;
const keyConfigLabels = [
  'ArrowUp',
  'ArrowLeft',
  'ArrowDown',
  'ArrowRight',
  'ShiftLeft',
  'Enter',
  'Space'
];
let configSetMap: { [key: string]: number; } = {};
let padSetMap: { [button: number]: number } = {};

const CanvasComponent: React.FC<CanvasComponentProps> = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameIdRef = useRef<number>();
  const [isOpen, setIsOpen] = useState(false);
  const [keyConfig, setKeyConfig] = useState<string[]>(keyConfigLabels);
  const [keySelect, setKeySelect] = useState(-1);
  const [keyLabels, setKeyLabels] = useState<string[]>([]);
  const [padEnabled, setPadEnabled] = useState<boolean>(false);
  const [padConfig, setPadConfig] = useState<boolean>(false);

  const makeKeyLabels = () => {
    const config = stick.getKeyConfig();
    for (let key in config) {
      const type = config[key];
      keyConfigLabels[keyConfigIndex.indexOf(type)] = key;
    }
  };
  const makePadLabels = () => {
    const config = (stick as GamepadStick).getPadConfig();
    for (let type of keyConfigIndex) {
      keyConfigLabels[keyConfigIndex.indexOf(type)] = "Button " + config.buttons[type];
    }
  };

  const pushPadHandler = (button: number) => {
    if (keySelectRef.current < 0 || button in padSetMap) {
      // すでに設定済み
      return;
    }
    (stick as GamepadStick).resetPad();
    padSetMap[button] = keyConfigIndex[keySelectRef.current];
    keyConfigLabels[keySelectRef.current] = "Button " + button;
    if (keySelectRef.current + 1 < keyConfigLabels.length) {
      setKeySelect(keySelectRef.current + 1);
    } else {
      setKeySelect(-1);
    }
  }
  const openDialog = (pad: boolean, button?: HTMLButtonElement) => {
    setPadConfig(pad);
    if (pad) {
      makePadLabels();
      (stick as GamepadStick).pushListener = pushPadHandler;
    } else {
      makeKeyLabels();
    }
    setIsOpen(true);
    setKeySelect(0);
    configSetMap = {};
    padSetMap = {};
    if (button) {
      button.blur();
    }
  };
  const closeDialog = () => {
    if (padConfig && stick instanceof GamepadStick) {
      (stick as GamepadStick).pushListener = undefined;
    }
    setIsOpen(false);
  };
  const applyDialog = () => {
    if (padConfig) {
      const pad = stick as GamepadStick;
      let newConfig = pad.getPadConfig();
      for (let key in padSetMap) {
        newConfig.buttons[padSetMap[key]] = parseInt(key);
      }
      pad.setPadConfig(newConfig);
    } else {
      let config: { [key: string]: ButtonType; } = {};
      for (let key in configSetMap) {
        config[key] = keyConfigIndex[configSetMap[key]];
      }
      stick.setKeyConfig(config);
      setKeyLabels([...keyConfigLabels]);
    }
    setIsOpen(false);
  };
  const onGamepadConnected = (e: GamepadEvent) => {
    console.log(e);
    stick = new GamepadStick(e.gamepad);
    setPadEnabled(true);
  };
  const onGamepadDisconnected = (e: GamepadEvent) => {
    console.log(e);
    stick = new KeyboardStick();
    setPadEnabled(false);
  };

  const isOpenRef = useRef(isOpen);
  const keySelectRef = useRef(keySelect);
  const padConfigRef = useRef(padConfig);

  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);
  useEffect(() => {
    keySelectRef.current = keySelect;
  }, [keySelect]);
  useEffect(() => {
    padConfigRef.current = padConfig;
  }, [padConfig]);
  const onKeyEvent = (event: KeyboardEvent) => {
    if (isOpenRef.current) {
      if (event.type === 'keydown' && !padConfigRef.current) {
        if (keySelectRef.current < 0 || event.code in configSetMap) {
          // すでに設定済み
          return;
        }
        event.preventDefault();
        configSetMap[event.code] = keySelectRef.current;
        keyConfigLabels[keySelectRef.current] = event.code;
        if (keySelectRef.current + 1 < keyConfigLabels.length) {
          setKeySelect(keySelectRef.current + 1);
        } else {
          setKeySelect(-1);
        }
      }
    } else {
      if (stick.processEvent(event as any)) {
        event.preventDefault();
      }
    }
  };

  let ignore = false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || ignore) return;
    saveData.getConfig('keyConfig').then(res => {
      makeKeyLabels();
      setKeyLabels([...keyConfigLabels]);
    });
    for (let pad of navigator.getGamepads()) {
      if (pad) {
        stick = new GamepadStick(pad);
        break;
      }
    }

    //const context = canvas.getContext('2d')!;
    context = canvas.getContext('webgl2')!;

    if (!playData) {
      playData = new TitlePlay(context);
    }
    const proc = () => {
      stick.checkButton();
      playData = playData.stepFrame(context, stick);
      if (playing) {
        animationFrameIdRef.current = requestAnimationFrame(proc);
      }
    };
    animationFrameIdRef.current = requestAnimationFrame(proc);
    //renderer.setStage(data);
    window.addEventListener("keydown", onKeyEvent, false);
    window.addEventListener("keyup", onKeyEvent, false);
    window.addEventListener("gamepadconnected", onGamepadConnected);
    window.addEventListener("gamepaddisconnected", onGamepadDisconnected);
    return () => {
      if (ignore) {
        cancelAnimationFrame(animationFrameIdRef.current!);
        window.removeEventListener("keydown", onKeyEvent);
        window.removeEventListener("keyup", onKeyEvent);
        window.removeEventListener("gamepadconnected", onGamepadConnected);
        window.removeEventListener("gamepaddisconnected", onGamepadDisconnected);
      }
      ignore = true;
    }
  }, []);

  return (
    <div style={{ display: "flex", padding: "1em" }}>
      <canvas ref={canvasRef} width={512} height={512} style={{ backgroundColor: "black" }} />
      <div>
        <Table striped bordered style={{ marginLeft: '1em' }}>
          <thead>
            <tr><th colSpan={2}>キー</th><th>操作内容</th></tr>
          </thead>
          <tbody>
            <tr><td><ArrowUp></ArrowUp></td><td>{keyLabels[0]}</td><td rowSpan={4}>プレイヤー移動<br />データ・モード選択<br />フロア選択</td></tr>
            <tr><td><ArrowLeft></ArrowLeft></td><td>{keyLabels[1]}</td></tr>
            <tr><td><ArrowDown></ArrowDown></td><td>{keyLabels[2]}</td></tr>
            <tr><td><ArrowRight></ArrowRight></td><td>{keyLabels[3]}</td></tr>
            <tr><td><CardList></CardList></td><td>{keyLabels[4]}</td><td>ゲーム種別選択</td></tr>
            <tr><td><CaretRight></CaretRight></td><td>{keyLabels[5]}</td><td>ゲーム開始・中断・再開</td></tr>
            <tr><td><BoxArrowInDownLeft></BoxArrowInDownLeft></td><td>{keyLabels[6]}</td><td>剣を抜く</td></tr>
          </tbody>
        </Table>
        <Button onClick={(event) => openDialog(false, event.target as HTMLButtonElement)}>キー設定</Button>
        {
          padEnabled && <Button onClick={(event) => openDialog(true, event.target as HTMLButtonElement)} style={{ marginLeft: "1em" }}>パッド設定</Button>
        }
        <Form>
          <Table bordered striped style={{ marginLeft: '1em', marginTop: '1em' }}>
            <thead>
              <tr><th colSpan={2}>サウンド設定</th></tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <Form.Label>BGM</Form.Label>
                </td><td>
                  <Form.Control type='range' min="0" max="1" step="0.01" defaultValue="0" onChange={e => {
                    setBgmVolumeLevel(parseFloat(e.target.value || "0"));
                  }} />
                </td>
              </tr>
              <tr>
                <td>
                  <Form.Label>効果音</Form.Label>
                </td><td>
                  <Form.Control type='range' min="0" max="1" step="0.01" defaultValue="0" onChange={e => {
                    setEffectVolumeLevel(parseFloat(e.target.value || "0"));
                  }} />
                </td>
              </tr>
            </tbody>
          </Table>
        </Form>
        <Modal show={isOpen} onHide={closeDialog}>
          <Modal.Header>
            <Modal.Title>{padConfig ? "パッド設定" : "キー設定"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Container>
              <Row>
                <Col xs={2}></Col>
                <Col xs={3} className='text-center'>
                  <ArrowUp size={50} className={keySelect === 0 ? 'bg-info' : ''}></ArrowUp>
                  <p style={{ fontSize: '10px' }}>{keyConfig[0]}</p>
                </Col>
                <Col xs={1}></Col>
                <Col xs={3} className='text-center'>
                  <CardList size={30} className={keySelect === 4 ? 'bg-info' : ''}></CardList>
                  <p style={{ fontSize: '10px' }}>{keyConfig[4]}</p>
                </Col>
                <Col xs={3} className='text-center'>
                  <CaretRight size={30} className={keySelect === 5 ? 'bg-info' : ''}></CaretRight>
                  <p style={{ fontSize: '10px' }}>{keyConfig[5]}</p>
                </Col>
              </Row>
              <Row>
                <Col xs={3} className='text-center'>
                  <ArrowLeft size={50} className={keySelect === 1 ? 'bg-info' : ''}></ArrowLeft>
                  <p style={{ fontSize: '10px' }}>{keyConfig[1]}</p>
                </Col>
                <Col xs={1}></Col>
                <Col xs={3} sm={3} md={3} lg={3} className='text-center'>
                  <ArrowRight size={50} className={keySelect === 3 ? 'bg-info' : ''}></ArrowRight>
                  <p style={{ fontSize: '10px' }}>{keyConfig[3]}</p>
                </Col>
              </Row>
              <Row>
                <Col xs={2}></Col>
                <Col xs={3} className='text-center'>
                  <ArrowDown size={50} className={keySelect === 2 ? 'bg-info' : ''}></ArrowDown>
                  <p style={{ fontSize: '10px' }}>{keyConfig[2]}</p>
                </Col>
                <Col xs={1}></Col>
                <Col xs={3} className='text-center'>
                  <BoxArrowInDownLeft size={50} className={keySelect === 6 ? 'bg-info' : ''}></BoxArrowInDownLeft>
                  <p style={{ fontSize: '10px' }}>{keyConfig[6]}</p>
                </Col>
              </Row>
            </Container>
          </Modal.Body>
          <Modal.Footer>
            <Button disabled={keySelect >= 0} variant='success' onClick={applyDialog}>決定</Button>
            <Button disabled={keySelect === 0} variant='warning' onClick={() => openDialog(padConfig)}>再設定</Button>
            <Button variant='danger' onClick={closeDialog}>キャンセル</Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div >
  );
};

export default CanvasComponent;
