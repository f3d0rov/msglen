
/*
Probability list structure:
[
	{
		message: {name: "x", index: 1}
		probability: Decimal
	},
	{
		message: {name: "x", index: 2}
		probability: Decimal
	},
	...
]
*/


function sortProbabilityListDesc (pl) {
	return pl.toSorted ((a, b) => {
		return a.probability.lessThan (b.probability);
	});
}

function sortProbabilityListAscByIndex (pl) {
	return pl.toSorted ((a, b) => {
		return a.message.index > b.message.index;
	});
}


function createTableForProbabilityList (pl, name, workspace) {
	let table = workspace.createTable (name);
	if (pl.length < 1) return;

	let varName = pl [0].message.name;

	table.addHeader ([
		workspace.getIndexedVariableHTML ({name: varName, index: "i"}),
		"p(" + workspace.getIndexedVariableHTML ({name: varName, index: "i"}) + ")"
	]);

	for (let i of pl) {
		table.addLine ([
			workspace.getIndexedVariableHTML (i.message),
			i.probability.toString()
		]);
	}

	return table;
}

class ShannonFanoTreeLeaf {
	constructor (pl, i) {
		this.leaf = pl.slice (i, i + 1);
		console.log ("leaf: " + i);
	}

	isLeaf () {
		return true;
	}

	totalDepth () {
		return 1;
	}

	totalNodeDepth () {
		return 0;
	}

	generateIterTable (rootObj, atDepth) {
		// Don't show list in the iter table
		// if (atDepth == 0) {
		// 	createTableForProbabilityList (this.leaf, "", rootObj);
		// }
	}

	getLeafCodes (myName) {
		return [
			{
				message: this.leaf[0].message,
				probability: this.leaf[0].probability,
				code: myName
			}
		];
	}
}

class ShannonFanoTreeNode {
	constructor (pl, a, b) {
		this.pl = pl;
		this.a = a;
		this.b = b;

		console.log (a + ", " + b);

		this.slice = pl.slice (a, b + 1);

		this.sum = this.countSum ();
		this.lastLeft = this.lastLeft ();

		this.leftNode = this.createNextNode (a, this.lastLeft);
		this.rightNode = this.createNextNode (this.lastLeft + 1, b);

		this.digit = null;
	}

	countSum () {
		// Count the sum for all the underlying leaves
		let sum = new Decimal (0);
		for (let i = this.a; i <= this.b; i++) {
			sum = sum.plus (this.pl [i].probability);
		}
		return sum;
	}

	lastLeft () {
		let idealCenter = this.sum.dividedBy (2);
		let currentSum = new Decimal (0);
		// Cannot chop before the first element or after the last:
		// `pl` is ordered, has at least 2 elements and the `idealCenter` is the middle between
		// its accumulated ends. The middle is guaranteed to have at least 1 element to its left and at least
		// one to the right.
		
		for (let i = this.a; i <= this.b; i++) {
			let thisProb = this.pl [i].probability; // This element
			let diffNow = idealCenter.minus (currentSum);
			let diffAfter = diffNow.minus (thisProb);


			// If taking this element means getting further away from the middle (or staying the same distance)
			if (diffAfter.absoluteValue().greaterThanOrEqualTo (diffNow.absoluteValue()))
				// Having this element would mess things up, means: the previous is the last we take.
				return i - 1;

			// Increment the `currentSum`
			currentSum = currentSum.plus (thisProb);
		}

		throw ("ShannonFanoTreeNode::lastLeft: failed to find the middle");
	}

	createNextNode (a, b) {
		if (a == b) {
			return new ShannonFanoTreeLeaf (this.pl, a);
		} else {
			return new ShannonFanoTreeNode (this.pl, a, b);
		}
	}

	isLeaf () {
		return false;
	}

	totalDepth () {
		return 1 + Math.max (this.rightNode.totalDepth(), this.leftNode.totalDepth());
	}

	totalNodeDepth () {
		return 1 + Math.max (this.rightNode.totalNodeDepth(), this.leftNode.totalNodeDepth());
	}

	generateIterTable (rootObj, atDepth) {
		if (atDepth > 0) {
			this.leftNode.generateIterTable (rootObj, atDepth - 1);
			this.rightNode.generateIterTable (rootObj, atDepth - 1);
		} else {
			let table = createTableForProbabilityList (this.slice, "Sum: " + this.sum.toString(), rootObj);
			table.separatorBeforeLine (this.lastLeft + 1 - this.a);
		}
	}
	
	getLeafCodes (myName = "") {
		return this.leftNode.getLeafCodes (myName + "0").concat (this.rightNode.getLeafCodes (myName + "1"));
	}
}

class ShannonFanoCodingAlgo {
	name () {
		return "Шеннон-Фано"
	}

	icon () {
		return "/svg/ok.svg";
	}

	work (probabilityList, workspace) {
		// Display the provided values
		createTableForProbabilityList (probabilityList, "Заданные значения p(x)", workspace);

		// Sort the provided values
		let sorted = sortProbabilityListDesc (probabilityList);

		// Build a tree by splitting list in half recursively
		let tree = this.buildTree (sorted);

		if (tree == null) return;

		// Show splits at each depth
		let depth = tree.totalNodeDepth();
		for (let i = 0; i < depth; i++) {
			let iterTables = workspace.createTableGroup ("Шаг #" + (i + 1));
			tree.generateIterTable (iterTables, i);
		}

		// Create the code table
		let codes = tree.getLeafCodes ();
		let sortedCodes = sortProbabilityListAscByIndex (codes);
		let codeTable = workspace.createTable ("Кодировка");
		codeTable.addHeader ([
			workspace.getIndexedVariableHTML ({name: "x", index: "i"}),
			"p(" + workspace.getIndexedVariableHTML ({name: "x", index: "i"}) + ")",
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

		// Calculate average message length
		let avgMsgLen = new Decimal (0);
		for (let i of sortedCodes) {
			avgMsgLen = avgMsgLen.plus (i.probability.times (i.code.length));
		}

		// Display avg message length value
		let avgMsgLenTable = workspace.createTable ("Результат");
		avgMsgLenTable.addHeader (["Средняя длина сообщения"]);
		avgMsgLenTable.addLine ([avgMsgLen]);
		avgMsgLenTable.highlightLine (0);
		
		// Done!
	}

	buildTree (pl) {
		if (pl.length > 1) {
			return new ShannonFanoTreeNode (pl, 0, pl.length - 1);
		}
		return null;
	}
}

window.addEventListener (
	'load',
	() => {
		registerMethod (new ShannonFanoCodingAlgo());
	}
);
