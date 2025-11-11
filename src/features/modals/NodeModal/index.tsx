import React, { useState, useEffect } from "react";
import type { ModalProps } from "@mantine/core";
import { Modal, Stack, Text, ScrollArea, Flex, CloseButton, Button, TextInput, Group, Textarea } from "@mantine/core";
import { CodeHighlight } from "@mantine/code-highlight";
import type { NodeData } from "../../../types/graph";
import useJson from "../../../store/useJson";
import useGraph from "../../editor/views/GraphView/stores/useGraph";

const normalize = (nodeRows: NodeData["text"]) => {
  if (!nodeRows || nodeRows.length === 0) return "{}";
  if (nodeRows.length === 1 && !nodeRows[0].key) return `${nodeRows[0].value}`;
  const obj = {};
  nodeRows?.forEach(row => {
    if (row.type !== "array" && row.type !== "object") {
      if (row.key) obj[row.key] = row.value;
    }
  });
  return JSON.stringify(obj, null, 2);
};

const jsonPathToString = (path?: NodeData["path"]) =>{
  if (!path || path.length === 0) return "$";
  const segments = path.map(seg => (typeof seg === "number" ? seg : `"${seg}"`));
  return `$[${segments.join("][")}]`;
};

export const NodeModal = ({ opened, onClose }: ModalProps) => {
  const nodeData = useGraph(state => state.selectedNode);
  const updateNode = useJson(state => state.updateNode);
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [editorValue, set_val] = useState("");

  useEffect(() => {
    setEditing(false);
    setInputValue("");
  }, [nodeData?.path, opened]);

  useEffect(() => {
    if (editing && nodeData && nodeData.text && nodeData.text.length === 1) {
      setInputValue(String(nodeData.text[0].value ?? ""));
    }
  }, [editing, nodeData]);

  useEffect(() => {
    if (editing && nodeData && nodeData.path && nodeData.path.length > 0) {
      try {
        const current = useJson.getState().json || "{}";
        const parsed = JSON.parse(current);
        let target: any = parsed;
        for (let i = 0; i < nodeData.path!.length; i++) {
          const seg = nodeData.path![i] as any;
          target = target?.[seg];
        }
        set_val(typeof target === "object" ? JSON.stringify(target, null, 2) : String(target ?? ""));
      } catch (e) {
        set_val("");
      }
    } else if (!editing) {
      set_val("");
    }
  }, [editing, nodeData]);

  const can_edit = !!(nodeData && nodeData.text && nodeData.text.length >= 1);

  useEffect(() => {
    if (opened) {
      console.log("opened: nodeData=", nodeData, "can_edit=", can_edit);
    }
  }, [opened, nodeData, can_edit]);
  const parseInput = (str: string) => {
    if (str === "true") return true;
    if (str === "null") return null;
    if (str === "false") return false;
    const num = Number(str);
    if (!Number.isNaN(num) && String(num) === str) return num;
    return str;
  };

  const save_handler = () => {
    if (!nodeData) return;
    let parsedValue: any;
    if (nodeData.text.length > 1 || (editorValue && editorValue.trim().startsWith("{") || editorValue.trim().startsWith("["))) {
      parsedValue = JSON.parse(editorValue);
    } else {
      parsedValue = parseInput(inputValue);
    }
    updateNode(nodeData.path, parsedValue);
    setEditing(false);
    onClose && onClose();
    
  };

  return (
    <Modal size="auto" opened={opened} onClose={onClose} centered withCloseButton={false}>
      <Stack pb="sm" gap="sm">
        <Stack gap="xs">
          <Flex justify="space-between" align="center">
            <Text fz="xs" fw={500}>
              Content
            </Text>
            <Group>
              {can_edit && !editing && (
                <Button size="xs" variant="outline" onClick={() => setEditing(true)}>
                  Edit
                </Button>
              )}
              {can_edit && editing && (
                <>
                  <Button size="xs" color="green" onClick={save_handler}>
                    Save
                  </Button>
                  <Button size="xs" color="gray" variant="light" onClick={() => setEditing(false)}>
                    Cancel
                  </Button>
                </>
              )}
              <CloseButton onClick={onClose} />
            </Group>
          </Flex>
          <ScrollArea.Autosize mah={250} maw={600}>
            {can_edit && editing ? (
              nodeData && nodeData.text.length === 1 && nodeData.text[0].type !== "object" && nodeData.text[0].type !== "array" ? (
                <TextInput
                  value={inputValue}
                  onChange={e => setInputValue(e.currentTarget.value)}
                  placeholder={String(nodeData?.text?.[0]?.value ?? "")}
                />
              ) : (
                <Textarea value={editorValue} onChange={e => set_val(e.currentTarget.value)} minRows={6} />
              )
            ):(
              <CodeHighlight
                code={normalize(nodeData?.text ?? [])}
                miw={350}
                maw={600}
                language="json"
                withCopyButton
              />
            )}
          </ScrollArea.Autosize>
        </Stack>
  
        <ScrollArea.Autosize maw={600}>
          <CodeHighlight
            code={jsonPathToString(nodeData?.path)}
            miw={350}
            mah={250}
            language="json"
            copyLabel="Copy"
            copiedLabel="Copied"
            withCopyButton
          />
        </ScrollArea.Autosize>
      </Stack>
    </Modal>
  );
};