export type SupportMode = "reasoning" | "evidence-backed";
export type DataType = "" | "fact" | "observation" | "example" | "estimate";

export interface TextSlot {
  id: string;
  text: string;
  touched: boolean;
}

export interface SupportingDataFact extends TextSlot {
  evidenceLink: string;
  dataType: DataType;
}

export interface SupportingArgument extends TextSlot {
  mode: SupportMode;
  data: SupportingDataFact[];
}

export interface ArgumentBoard {
  schemaVersion: 1;
  appName: "Argument Maker";
  title: string;
  createdAt: string;
  updatedAt: string;
  scqa: {
    situation: TextSlot;
    complication: TextSlot;
    question: TextSlot;
    answer: TextSlot;
  };
  supportingArguments: SupportingArgument[];
}

export type ArgumentBoardCommand =
  | { type: "update-title"; title: string }
  | { type: "update-scqa"; field: keyof ArgumentBoard["scqa"]; text: string }
  | { type: "update-supporting-argument"; argumentId: string; changes: Partial<Pick<SupportingArgument, "text" | "mode">> }
  | {
      type: "update-supporting-data-fact";
      argumentId: string;
      dataId: string;
      changes: Partial<Pick<SupportingDataFact, "text" | "evidenceLink" | "dataType">>;
    }
  | { type: "add-supporting-argument" }
  | { type: "add-supporting-data-fact"; argumentId: string }
  | { type: "delete-supporting-argument"; argumentId: string }
  | { type: "delete-supporting-data-fact"; argumentId: string; dataId: string }
  | { type: "move-supporting-argument"; argumentId: string; direction: "up" | "down" }
  | { type: "move-supporting-data-fact"; argumentId: string; dataId: string; direction: "up" | "down" }
  | { type: "duplicate-supporting-argument"; argumentId: string }
  | { type: "duplicate-supporting-data-fact"; argumentId: string; dataId: string };

const DEFAULT_SUPPORTING_ARGUMENT_COUNT = 3;
const DEFAULT_SUPPORTING_DATA_COUNT = 3;

export function createDefaultBoard(now = new Date()): ArgumentBoard {
  const timestamp = now.toISOString();

  return {
    schemaVersion: 1,
    appName: "Argument Maker",
    title: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    scqa: {
      situation: createTextSlot("situation"),
      complication: createTextSlot("complication"),
      question: createTextSlot("question"),
      answer: createTextSlot("answer"),
    },
    supportingArguments: Array.from({ length: DEFAULT_SUPPORTING_ARGUMENT_COUNT }, (_, argumentIndex) =>
      createSupportingArgument(argumentIndex),
    ),
  };
}

export function applyArgumentBoardCommand(
  board: ArgumentBoard,
  command: ArgumentBoardCommand,
  now = new Date(),
): ArgumentBoard {
  switch (command.type) {
    case "update-title":
      return updateBoardTitle(board, command.title, now);
    case "update-scqa":
      return updateScqaField(board, command.field, command.text, now);
    case "update-supporting-argument":
      return updateSupportingArgument(board, command.argumentId, command.changes, now);
    case "update-supporting-data-fact":
      return updateSupportingDataFact(board, command.argumentId, command.dataId, command.changes, now);
    case "add-supporting-argument":
      return addSupportingArgument(board, now);
    case "add-supporting-data-fact":
      return addSupportingDataFact(board, command.argumentId, now);
    case "delete-supporting-argument":
      return deleteSupportingArgument(board, command.argumentId, now);
    case "delete-supporting-data-fact":
      return deleteSupportingDataFact(board, command.argumentId, command.dataId, now);
    case "move-supporting-argument":
      return moveSupportingArgument(board, command.argumentId, command.direction, now);
    case "move-supporting-data-fact":
      return moveSupportingDataFact(board, command.argumentId, command.dataId, command.direction, now);
    case "duplicate-supporting-argument":
      return duplicateSupportingArgument(board, command.argumentId, now);
    case "duplicate-supporting-data-fact":
      return duplicateSupportingDataFact(board, command.argumentId, command.dataId, now);
  }
}

function createTextSlot(id: string): TextSlot {
  return {
    id,
    text: "",
    touched: false,
  };
}

function createSupportingArgument(argumentIndex: number): SupportingArgument {
  const id = `argument-${argumentIndex + 1}`;

  return {
    ...createTextSlot(id),
    mode: "reasoning",
    data: Array.from({ length: DEFAULT_SUPPORTING_DATA_COUNT }, (_, dataIndex) =>
      createSupportingDataFact(argumentIndex, dataIndex),
    ),
  };
}

function createSupportingDataFact(argumentIndex: number, dataIndex: number): SupportingDataFact {
  return {
    ...createTextSlot(`argument-${argumentIndex + 1}-data-${dataIndex + 1}`),
    evidenceLink: "",
    dataType: "",
  };
}

export function updateScqaField(
  board: ArgumentBoard,
  field: keyof ArgumentBoard["scqa"],
  text: string,
  now = new Date(),
): ArgumentBoard {
  return touchBoard(
    {
      ...board,
      scqa: {
        ...board.scqa,
        [field]: {
          ...board.scqa[field],
          text,
          touched: true,
        },
      },
    },
    now,
  );
}

export function updateBoardTitle(board: ArgumentBoard, title: string, now = new Date()): ArgumentBoard {
  return touchBoard(
    {
      ...board,
      title,
    },
    now,
  );
}

export function updateSupportingArgument(
  board: ArgumentBoard,
  argumentId: string,
  changes: Partial<Pick<SupportingArgument, "text" | "mode">>,
  now = new Date(),
): ArgumentBoard {
  return touchBoard(
    {
      ...board,
      supportingArguments: board.supportingArguments.map((argument) =>
        argument.id === argumentId
          ? {
              ...argument,
              ...changes,
              touched: changes.text === undefined ? argument.touched : true,
            }
          : argument,
      ),
    },
    now,
  );
}

export function updateSupportingDataFact(
  board: ArgumentBoard,
  argumentId: string,
  dataId: string,
  changes: Partial<Pick<SupportingDataFact, "text" | "evidenceLink" | "dataType">>,
  now = new Date(),
): ArgumentBoard {
  return touchBoard(
    {
      ...board,
      supportingArguments: board.supportingArguments.map((argument) =>
        argument.id === argumentId
          ? {
              ...argument,
              data: argument.data.map((item) =>
                item.id === dataId
                  ? {
                      ...item,
                      ...changes,
                      touched: changes.text === undefined ? item.touched : true,
                    }
                  : item,
              ),
            }
          : argument,
      ),
    },
    now,
  );
}

export function addSupportingArgument(board: ArgumentBoard, now = new Date()): ArgumentBoard {
  const nextIndex = board.supportingArguments.length;

  return touchBoard(
    {
      ...board,
      supportingArguments: [...board.supportingArguments, createSupportingArgument(nextIndex)],
    },
    now,
  );
}

export function addSupportingDataFact(board: ArgumentBoard, argumentId: string, now = new Date()): ArgumentBoard {
  return touchBoard(
    {
      ...board,
      supportingArguments: board.supportingArguments.map((argument, argumentIndex) =>
        argument.id === argumentId
          ? {
              ...argument,
              data: [...argument.data, createSupportingDataFact(argumentIndex, argument.data.length)],
            }
          : argument,
      ),
    },
    now,
  );
}

export function deleteSupportingArgument(board: ArgumentBoard, argumentId: string, now = new Date()): ArgumentBoard {
  return touchBoard(
    {
      ...board,
      supportingArguments: board.supportingArguments.filter((argument) => argument.id !== argumentId),
    },
    now,
  );
}

export function deleteSupportingDataFact(
  board: ArgumentBoard,
  argumentId: string,
  dataId: string,
  now = new Date(),
): ArgumentBoard {
  return touchBoard(
    {
      ...board,
      supportingArguments: board.supportingArguments.map((argument) =>
        argument.id === argumentId
          ? {
              ...argument,
              data: argument.data.filter((item) => item.id !== dataId),
            }
          : argument,
      ),
    },
    now,
  );
}

export function moveSupportingDataFact(
  board: ArgumentBoard,
  argumentId: string,
  dataId: string,
  direction: "up" | "down",
  now = new Date(),
): ArgumentBoard {
  const nextArguments = board.supportingArguments.map((argument) => {
    if (argument.id !== argumentId) {
      return argument;
    }

    const currentIndex = argument.data.findIndex((item) => item.id === dataId);
    const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

    if (currentIndex < 0 || targetIndex < 0 || targetIndex >= argument.data.length) {
      return argument;
    }

    const nextData = [...argument.data];
    const current = nextData[currentIndex]!;
    nextData[currentIndex] = nextData[targetIndex]!;
    nextData[targetIndex] = current;

    return {
      ...argument,
      data: nextData,
    };
  });

  return touchBoard({ ...board, supportingArguments: nextArguments }, now);
}

export function duplicateSupportingDataFact(
  board: ArgumentBoard,
  argumentId: string,
  dataId: string,
  now = new Date(),
): ArgumentBoard {
  const nextArguments = board.supportingArguments.map((argument) => {
    if (argument.id !== argumentId) {
      return argument;
    }

    const currentIndex = argument.data.findIndex((item) => item.id === dataId);

    if (currentIndex < 0) {
      return argument;
    }

    const original = argument.data[currentIndex]!;
    const copyId = makeCopyId(original.id, argument.data.map((item) => item.id));
    const nextData = [...argument.data];
    nextData.splice(currentIndex + 1, 0, { ...original, id: copyId });

    return {
      ...argument,
      data: nextData,
    };
  });

  return touchBoard({ ...board, supportingArguments: nextArguments }, now);
}

export function moveSupportingArgument(
  board: ArgumentBoard,
  argumentId: string,
  direction: "up" | "down",
  now = new Date(),
): ArgumentBoard {
  const currentIndex = board.supportingArguments.findIndex((argument) => argument.id === argumentId);
  const targetIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;

  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= board.supportingArguments.length) {
    return board;
  }

  const nextArguments = [...board.supportingArguments];
  const current = nextArguments[currentIndex]!;
  nextArguments[currentIndex] = nextArguments[targetIndex]!;
  nextArguments[targetIndex] = current;

  return touchBoard({ ...board, supportingArguments: nextArguments }, now);
}

export function duplicateSupportingArgument(board: ArgumentBoard, argumentId: string, now = new Date()): ArgumentBoard {
  const currentIndex = board.supportingArguments.findIndex((argument) => argument.id === argumentId);

  if (currentIndex < 0) {
    return board;
  }

  const original = board.supportingArguments[currentIndex]!;
  const copyId = makeCopyId(original.id, board.supportingArguments.map((argument) => argument.id));
  const copy: SupportingArgument = {
    ...original,
    id: copyId,
    data: original.data.map((item, index) => ({
      ...item,
      id: `${copyId}-data-${index + 1}`,
    })),
  };
  const nextArguments = [...board.supportingArguments];
  nextArguments.splice(currentIndex + 1, 0, copy);

  return touchBoard({ ...board, supportingArguments: nextArguments }, now);
}

function makeCopyId(baseId: string, existingIds: string[]): string {
  let copyIndex = 1;
  let candidate = `${baseId}-copy`;

  while (existingIds.includes(candidate)) {
    copyIndex += 1;
    candidate = `${baseId}-copy-${copyIndex}`;
  }

  return candidate;
}

function touchBoard(board: ArgumentBoard, now: Date): ArgumentBoard {
  return {
    ...board,
    updatedAt: now.toISOString(),
  };
}
