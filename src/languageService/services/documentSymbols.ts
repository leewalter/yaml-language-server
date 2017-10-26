/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';

import Parser = require('../parser/jsonParser');
import Strings = require('../utils/strings');

import { SymbolInformation, SymbolKind, TextDocument, Range, Location } from 'vscode-languageserver-types';
import { Thenable } from "../yamlLanguageService";
import { IJSONSchemaService } from "./jsonSchemaService";

export class YAMLDocumentSymbols {

	public findDocumentSymbols(document: TextDocument, doc: Parser.JSONDocument): SymbolInformation[] {

		if(!doc || !doc["root"]){
			return null;
		}

		let root = doc["root"];
	
		let collectOutlineEntries = (result: SymbolInformation[], node: Parser.ASTNode, containerName: string): SymbolInformation[] => {
			if (node.type === 'array') {
				(<Parser.ArrayASTNode>node).items.forEach((node: Parser.ASTNode) => {
					collectOutlineEntries(result, node, containerName);
				});
			} else if (node.type === 'object') {
				let objectNode = <Parser.ObjectASTNode>node;
	
				objectNode.properties.forEach((property: Parser.PropertyASTNode) => {
					let location = Location.create(document.uri, Range.create(document.positionAt(property.start), document.positionAt(property.end)));
					let valueNode = property.value;
					if (valueNode) {
						let childContainerName = containerName ? containerName + '.' + property.key.value : property.key.value;
						result.push({ name: property.key.getValue(), kind: this.getSymbolKind(valueNode.type), location: location, containerName: containerName });
						collectOutlineEntries(result, valueNode, childContainerName);
					}
				});
			}
			return result;
		};
		let result = collectOutlineEntries([], root, void 0);
		return result;
	}

	private getSymbolKind(nodeType: string): SymbolKind {
		switch (nodeType) {
			case 'object':
				return SymbolKind.Module;
			case 'string':
				return SymbolKind.String;
			case 'number':
				return SymbolKind.Number;
			case 'array':
				return SymbolKind.Array;
			case 'boolean':
				return SymbolKind.Boolean;
			default: // 'null'
				return SymbolKind.Variable;
		}
	}

}