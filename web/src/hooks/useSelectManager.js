import { useEffect, useState } from "react";
import { SMStateEnum } from "../utils/enums";
import {
  calcPosOnDrag,
  generateDiffAndFlag,
  setMoveMapByKey,
} from "../utils/selectManagerTools";
import {
  GroupEventManager,
  GroupKeyMapKey,
} from "../eventTarget/GroupEventManager";

export const useSelectManager = () => {
  const [svgGroup, setSvgGroup] = useState(new Map());
  const [diffAndFlagMap, setDiffAndFlagMap] = useState(new Map());
  const [SMState, setSMState] = useState(SMStateEnum.none);
  const [selectBoxSize, setSelectBoxSize] = useState({
    src: { x: 0, y: 0 },
    dest: { x: 0, y: 0 },
  });
  const isGrouping = GroupEventManager.getInstance().getGroupingState();

  useEffect(() => {
    const moveOnKeyDown = () => {
      const GKM = GroupEventManager.getInstance().getGroupKeyMoveMap();

      for (const [key, value] of svgGroup) {
        const moveOnDrag = value.moveOnDrag;
        const { objPos } = value.getObjInfo();
        const movePos = {
          x: objPos.x + GKM.get(GroupKeyMapKey.x),
          y: objPos.y + GKM.get(GroupKeyMapKey.y),
        };

        moveOnDrag(movePos);
      }
    };

    const onKeyDown = (e) => {
      if (!GroupEventManager.getInstance().getGroupingState()) return;

      setMoveMapByKey(e.key);
      moveOnKeyDown();
    };

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);

      if (svgGroup.size === 0) {
        GroupEventManager.getInstance().resetGroupKeyMoveMap();
      }
    };
  }, [svgGroup]);

  const setDiffPosOnAll = (clientPos) => {
    // if (SMState === SMStateEnum.select)
    for (const [key, value] of svgGroup) {
      const { objPos, objSize } = value.getObjInfo();

      const clientX = clientPos.x;
      const clientY = clientPos.y;
      const objX = objPos.x;
      const objX2 = objX + objSize.width;
      const objY = objPos.y;
      const objY2 = objY + objSize.height;

      const idProps = generateDiffAndFlag(
        objX,
        objX2,
        objY,
        objY2,
        clientX,
        clientY,
      );
      setDiffAndFlagMap((prev) => new Map(prev).set(key, idProps));
    }

    setSMState(SMStateEnum.drag);
  };

  const onDrag = (dragPos) => {
    if (svgGroup.size === 0 || SMState !== SMStateEnum.drag) return;

    for (const [key, value] of svgGroup) {
      if (!diffAndFlagMap.has(key)) continue;

      const { diffDistance, flag } = diffAndFlagMap.get(key);
      const moveOnDrag = value.moveOnDrag;
      const fixPos = calcPosOnDrag(flag, dragPos, diffDistance);

      moveOnDrag(fixPos);
    }
  };

  const onDrop = () => {
    if (svgGroup.size > 0 && SMState === SMStateEnum.drag) {
      svgGroup.forEach((value, key) => {
        const stopOnDrop = value.stopOnDrop;

        stopOnDrop(isGrouping, true);
      });
      removeAllSvg();
      setSMState(SMStateEnum.none);

      const quitGroupEvent = new CustomEvent(GroupEventManager.eventName, {
        bubbles: true,
        cancelable: true,
        detail: {
          isGrouping: false,
        },
      });

      GroupEventManager.getInstance().dispatchEvent(quitGroupEvent);
    }
  };

  const selectSvg = (id, objTools) => {
    setSvgGroup(() => {
      return new Map().set(id, objTools);
    });
    setSMState(SMStateEnum.select);
  };

  const addSvgToGroup = (id, objTools) => {
    setSvgGroup((prev) => new Map([...prev, [id, objTools]]));
    setSMState(SMStateEnum.select);

    const insertGroupEvent = new CustomEvent(GroupEventManager.eventName, {
      bubbles: true,
      cancelable: true,
      detail: {
        isGrouping: true,
      },
    });

    GroupEventManager.getInstance().dispatchEvent(insertGroupEvent);
  };

  const removeSvgFromGroup = (id) => {
    setSvgGroup((prev) => {
      const newMap = new Map(prev);
      newMap.delete(id);
      return newMap;
    });
  };

  const removeAllSvg = () => {
    setSvgGroup(new Map());
  };

  const initClientSelectBoxSize = (fixPos) => {
    if (isGrouping) return false;

    setSelectBoxSize({
      src: fixPos,
      dest: fixPos,
    });

    return true;
  };

  const setClientSelectBoxSize = (fixPos) => {
    setSelectBoxSize((prev) => {
      return {
        src: prev.src,
        dest: fixPos,
      };
    });
  };

  const isCollision = (objInfo) => {
    const { objPos, objSize } = objInfo;
    console.log("isCollision", objPos, objSize);
  };

  const finClientSelectBoxSize = (posMap) => {
    const leftTop = {
      x: Math.min(selectBoxSize.src.x, selectBoxSize.dest.x),
      y: Math.min(selectBoxSize.src.y, selectBoxSize.dest.y),
    };
    const width = Math.abs(selectBoxSize.src.x - selectBoxSize.dest.x);
    const height = Math.abs(selectBoxSize.src.y - selectBoxSize.dest.y);

    for (const [key, value] of posMap) {
      console.log(key, value);
    }

    setTimeout(() => {
      setSelectBoxSize({
        src: { x: 0, y: 0 },
        dest: { x: 0, y: 0 },
      });
    }, 400);
  };

  return {
    handleSelect: {
      selectSvg,
      addSvgToGroup,
      removeSvgFromGroup,
      removeAllSvg,
    },
    setDiffPosOnAll,
    onDrag,
    onDrop,
    selectBoxSize,
    initClientSelectBoxSize,
    setClientSelectBoxSize,
    finClientSelectBoxSize,
  };
};
