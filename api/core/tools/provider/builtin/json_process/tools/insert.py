from typing import Any, Union
from core.tools.entities.tool_entities import ToolInvokeMessage
from core.tools.tool.builtin_tool import BuiltinTool

import json
from jsonpath_ng import parse

class JSONParseTool(BuiltinTool):
    def _invoke(self,
                user_id: str,
                tool_parameters: dict[str, Any],
                ) -> Union[ToolInvokeMessage, list[ToolInvokeMessage]]:
        """
            invoke tools
        """
        # get content
        content = tool_parameters.get('content', '')
        if not content:
            return self.create_text_message('Invalid parameter content')
        
        # get query
        query = tool_parameters.get('query', '')
        if not query:
            return self.create_text_message('Invalid parameter query')
        
        # get new value
        new_value = tool_parameters.get('new_value', '')
        if not new_value:
            return self.create_text_message('Invalid parameter new_value')
        
        # get insert position
        index = tool_parameters.get('index', None)
        
        # get create path
        create_path = tool_parameters.get('create_path', False)
        
        try:
            result = self._insert(content, query, new_value, index, create_path)
            return self.create_text_message(str(result))
        except Exception:
            return self.create_text_message('Failed to insert JSON content')


    def _insert(self, origin_json, query, new_value, index=None, create_path=False):
        try:
            input_data = json.loads(origin_json)
            expr = parse(query)
            try:
                new_value = json.loads(new_value)
            except json.JSONDecodeError:
                new_value = new_value
            
            matches = expr.find(input_data)
            
            if not matches and create_path:
                # 创建新路径
                path_parts = query.strip('$').strip('.').split('.')
                current = input_data
                for i, part in enumerate(path_parts):
                    if '[' in part and ']' in part:
                        # 处理数组索引
                        array_name, index = part.split('[')
                        index = int(index.rstrip(']'))
                        if array_name not in current:
                            current[array_name] = []
                        while len(current[array_name]) <= index:
                            current[array_name].append({})
                        current = current[array_name][index]
                    else:
                        if i == len(path_parts) - 1:
                            current[part] = new_value
                        elif part not in current:
                            current[part] = {}
                        current = current[part]
            else:
                for match in matches:
                    if isinstance(match.value, dict):
                        # 向对象插入键值对
                        if isinstance(new_value, dict):
                            match.value.update(new_value)
                        else:
                            raise ValueError("Cannot insert non-dict value into dict")
                    elif isinstance(match.value, list):
                        # 向数组插入元素
                        if index is None:
                            match.value.append(new_value)
                        else:
                            match.value.insert(int(index), new_value)
                    else:
                        # 替换原有值
                        match.full_path.update(input_data, new_value)
            
            return json.dumps(input_data)
        except Exception as e:
            return str(e)