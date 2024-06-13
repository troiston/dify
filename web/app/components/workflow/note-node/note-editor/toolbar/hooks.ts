import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import {
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_TEXT_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical'
import {
  $getSelectionStyleValueForProperty,
  $patchStyleText,
} from '@lexical/selection'
import { INSERT_UNORDERED_LIST_COMMAND } from '@lexical/list'
import { mergeRegister } from '@lexical/utils'
import {
  $isLinkNode,
  TOGGLE_LINK_COMMAND,
} from '@lexical/link'
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext'
import { useNoteEditorStore } from '../store'
import { getSelectedNode } from '../utils'

export const useCommand = () => {
  const [editor] = useLexicalComposerContext()
  const noteEditorStore = useNoteEditorStore()

  const handleCommand = useCallback((type: string) => {
    if (type === 'bold')
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'bold')

    if (type === 'strikethrough')
      editor.dispatchCommand(FORMAT_TEXT_COMMAND, 'strikethrough')

    if (type === 'link') {
      editor.update(() => {
        const selection = $getSelection()

        if ($isRangeSelection(selection) && !selection.isCollapsed()) {
          const node = getSelectedNode(selection)
          const parent = node.getParent()

          if (!($isLinkNode(parent) && $isLinkNode(node)))
            editor.dispatchCommand(TOGGLE_LINK_COMMAND, '')

          const { setLinkAnchorElement } = noteEditorStore.getState()
          setLinkAnchorElement(true)
        }
      })
    }

    if (type === 'bullet')
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined)
  }, [editor, noteEditorStore])

  return {
    handleCommand,
  }
}

export const useFontSize = () => {
  const [editor] = useLexicalComposerContext()
  const [fontSize, setFontSize] = useState('12px')
  const [fontSizeSelectorShow, setFontSizeSelectorShow] = useState(false)

  const handleFontSize = useCallback((fontSize: string) => {
    editor.update(() => {
      const selection = $getSelection()

      if ($isRangeSelection(selection))
        $patchStyleText(selection, { 'font-size': fontSize })
    })
  }, [editor])

  const handleOpenFontSizeSelector = useCallback((newFontSizeSelectorShow: boolean) => {
    if (newFontSizeSelectorShow) {
      editor.update(() => {
        const selection = $getSelection()

        if ($isRangeSelection(selection))
          $setSelection(selection.clone())
      })
    }
    setFontSizeSelectorShow(newFontSizeSelectorShow)
  }, [editor])

  useEffect(() => {
    return mergeRegister(
      editor.registerUpdateListener(() => {
        editor.getEditorState().read(() => {
          const selection = $getSelection()

          if ($isRangeSelection(selection)) {
            const fontSize = $getSelectionStyleValueForProperty(selection, 'font-size', '12px')
            setFontSize(fontSize)
          }
        })
      }),
      editor.registerCommand(
        SELECTION_CHANGE_COMMAND,
        () => {
          const selection = $getSelection()

          if ($isRangeSelection(selection)) {
            const fontSize = $getSelectionStyleValueForProperty(selection, 'font-size', '12px')
            setFontSize(fontSize)
          }

          return false
        },
        COMMAND_PRIORITY_CRITICAL,
      ),
    )
  }, [editor])

  return {
    fontSize,
    handleFontSize,
    fontSizeSelectorShow,
    handleOpenFontSizeSelector,
  }
}