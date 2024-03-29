
var huffmanIndexSeparator = '';

class HuffmanTreeNode {
	constructor (branch1, branch2) {
		// Make the more probable branch the left one
		let branch1Prob = branch1.totalProbability();
		let branch2Prob = branch2.totalProbability();

		if (branch1Prob.greaterThanOrEqualTo (branch2Prob)) {
			this.leftBranch = branch1;
			this.rightBranch = branch2;
		} else {
			this.leftBranch = branch2;
			this.rightBranch = branch1;
		}

		this.branchIndex = '' + this.leftBranch.getVarIndex().index + huffmanIndexSeparator + this.rightBranch.getVarIndex().index;
	}

	totalProbability () {
		return this.leftBranch.totalProbability().plus (this.rightBranch.totalProbability());
	}

	getVarIndex () {
		return {
			name: this.leftBranch.getVarIndex().name,
			index: this.branchIndex
		};
	}
	
	name (workspace) {
		return workspace.getIndexedVariableHTML (this.getVarIndex());
	}

	varName () {
		return this.leftBranch.varName();
	}

	getCodeNames (myName = "") {
		return this.leftBranch.getCodeNames (myName + "0").concat (this.rightBranch.getCodeNames (myName + "1"));
	}
}

class HuffmanTreeLeaf {
	constructor (message) {
		this.message = message;
	}

	totalProbability () {
		return this.message.probability;
	}
	
	getVarIndex () {
		return this.message.message;
	}

	name (workspace) {
		return workspace.getIndexedVariableHTML (this.getVarIndex());
	}
	
	varName () {
		return this.message.message.name;
	}


	getCodeNames (myName = "") {
		return [
			{
				message: this.message.message,
				probability: this.message.probability,
				code: myName
			}
		];
	}
}


class HuffmanCodingAlgo {
	name () {
		return "Хаффман";
	}

	icon () {
		return "https://raw.githubusercontent.com/f3d0rov/msglen/main/res/ok.svg";
	}

	listBranches (branches, workspace, name = "") {
		if (branches.length == 0) return;

		let newTable = workspace.createTable (name);
		let varName = branches[0].varName();

		newTable.addHeader ([
			workspace.getIndexedVariableHTML ({name: varName, index: "i"}),
			"p(" + workspace.getIndexedVariableHTML ({name: varName, index: "i"}) + ")"
		]);


		let count = 0;
		for (let i of branches) {
			newTable.addLine ([
				i.name (workspace),
				i.totalProbability().toString()
			]);

			if (this.lastFusedNodeIndex === i.branchIndex) {
				newTable.highlightLine (count);
			}

			count++;
		}
	
		// Highlight the next joining branches
		if (branches.length > 1) {
			newTable.separatorBeforeLine (branches.length - 2);
		}
	}

	sortBranches (branches) {
		branches.sort ((a, b) => {
			return b.totalProbability().comparedTo (a.totalProbability());
		});
	}

	fuseLastBranches (branches) {
		if (branches.length > 1) {
			let newNode = new HuffmanTreeNode (branches [branches.length - 2], branches [branches.length - 1]);
			// Remove two last branches and add the new node
			branches.splice (branches.length - 2, 2, newNode);
			this.lastFusedNodeIndex = newNode.branchIndex;
		}
	}

	buildCodeTable (topNode, workspace) {
		let codes = topNode.getCodeNames ();
		let sortedCodes = sortProbabilityListAscByIndex (codes);
		let codeTable = workspace.createTable ("Кодировка");
		let varName = getVarName (codes);
		codeTable.addHeader ([
			workspace.getIndexedVariableHTML ({name: varName, index: "i"}),
			"p(" + workspace.getIndexedVariableHTML ({name: varName, index: "i"}) + ")",
			"Код",
			"l"
		]);

		for (let i of sortedCodes) {
			codeTable.addLine ([
				workspace.getIndexedVariableHTML (i.message),
				i.probability.toString(),
				i.code,
				i.code.length
			]);
		}

		return sortedCodes;
	}
	
	work (probabilityList, workspace) {
		huffmanIndexSeparator = (probabilityList.length > 9) ? ":" : "";
		this.lastFusedNodeIndex = null;

		// Display the provided values
		createTableForProbabilityList (probabilityList, `Заданные значения p(${getVarName (probabilityList)})`, workspace);

		// Sort the provided values
		let sorted = sortProbabilityListDesc (probabilityList);

		// Create a list of branches
		let branches = [];
		for (let i of sorted) {
			branches.push (new HuffmanTreeLeaf (i));
		}

		// Fuse the 2 least probable branches until only one is left
		let stepCount = 1;
		while (branches.length > 1) {
			this.listBranches (branches, workspace, `Шаг #${stepCount}`);
			this.fuseLastBranches (branches);
			this.sortBranches (branches);
			stepCount += 1;
		}
		this.listBranches (branches, workspace, `Шаг #${stepCount}`);

		// Build the code table
		let codeTable = this.buildCodeTable (branches [0], workspace);

		// Calculate average message length
		let avgMsgLen = new Decimal (0);
		for (let i of codeTable) {
			avgMsgLen = avgMsgLen.plus (i.probability.times (i.code.length));
		}

		// Display avg message length value
		let avgMsgLenTable = workspace.createTable ("Результат");
		avgMsgLenTable.addHeader (["Средняя длина сообщения"]);
		avgMsgLenTable.addLine ([avgMsgLen]);
		avgMsgLenTable.highlightLine (0);

		// Done!
	}
}


window.addEventListener (
	'load',
	() => {
		registerMethod (new HuffmanCodingAlgo());
	}
);
