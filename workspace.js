
class TableHeader {
	constructor (tableRoot) {
		this.root = tableRoot;
		this.elem = document.createElement ("tr");
		this.root.appendChild (this.elem);
	}

	addHeader (title) {
		let newHeader = document.createElement ("th");
		newHeader.innerHTML = title;
		this.elem.appendChild (newHeader);
	}
	
	setSeparator (enable = true) {
		if (enable) {
			this.elem.classList.add ("separator_after");
		} else {
			this.elem.classList.remove ("separator_after");
		}
	}
}


class TableLine {
	constructor (root, values) {
		this.root = root;
		this.elem = document.createElement ("tr");
		this.root.appendChild (this.elem);
		this.setValues (values);
	}

	setValues (values) {
		this.elem.innerHTML = "";

		for (let i of values) {
			let newValue = document.createElement ("td");
			newValue.innerHTML = i;
			this.elem.appendChild (newValue);
		}
	}

	highlight (enable = true) {
		if (enable) {
			this.elem.classList.add ("highlighted");
		} else {
			this.elem.classList.remove ("highlighted");
		}
	}

	setSeparator (enable = true) {
		if (enable) {
			this.elem.classList.add ("separator_after");
		} else {
			this.elem.classList.remove ("separator_after");
		}
	}
};


class Table {
	constructor (workspaceRoot, title, spacer = false) {
		this.template = document.getElementById ("workspace_table_template");
		this.elem = this.template.cloneNode (true);
		this.root = this.elem.querySelector ('.workspace_table_table');
		this.elem.id = "";
		this.elem.classList.remove ("template");
		workspaceRoot.appendChild (this.elem);

		this.tableTitleElem = this.elem.querySelector (".table_title");
		this.tableTitleElem.innerHTML = title != "" ? title : "&ThinSpace;";

		if (spacer) {
			this.elem.classList.add ('spacer');
		}

		this.header = new TableHeader (this.root);
		this.lines = [];
	}

	addHeader (titleList) {
		for (let i of titleList) {
			this.header.addHeader (i);
		}
	}

	addLine (values) {
		this.lines.push (
			new TableLine (this.root, values)
		);
	}

	size () {
		return this.lines.length();
	}

	highlightLine (lineNumber, enable = true) {
		this.lines [lineNumber].highlight (enable);
	}

	separatorBeforeLine (lineNumber, enable = true) {
		if (lineNumber == 0) {
			this.header.setSeparator (enable);
		} else {
			console.log (lineNumber);
			this.lines [lineNumber - 1].setSeparator (enable);
		}
	}
}

class TableGroup {
	constructor (workspace, title) {
		this.root = workspace.workspaceElem;
		this.workspace = workspace;
		const template = document.getElementById ("workspace_table_group_template");
		this.elem = template.cloneNode (true);
		this.elem.id = "";
		this.elem.classList.remove ("template");
		this.root.appendChild (this.elem);

		this.titleElem = this.elem.querySelector ('.workspace_table_group_title');
		this.titleElem.innerHTML = title;
	}

	createTable (title = "") {
		return new Table (this.elem, title);
	}
	getIndexedVariableHTML (indexedVar) {
		return this.workspace.getIndexedVariableHTML (indexedVar);
	}
}

class Workspace {
	constructor () {
		this.workspaceElem = document.getElementById ("workspace_space");
		this.workspaceLoadingElem = document.getElementById ("loading_overlay");
		window.addEventListener ('resize', () => {
			this.workspaceElem.dispatchEvent (new Event ("resize"));
		})
	}

	clear () {
		this.workspaceElem.innerHTML = "";
		this.workspaceElem.dispatchEvent (new Event ("resize"));
	}

	loading () {
		this.workspaceLoadingElem.classList.remove ("template");
	}

	loaded () {
		this.workspaceElem.dispatchEvent (new Event ("resize"));
		this.workspaceLoadingElem.classList.add ("template");
	}

	createTable (title = "") {
		return new Table (this.workspaceElem, title, true);
	}

	createTableGroup (title = "") {
		return new TableGroup (this, title);
	}

	// indexedVar: {name: "x", index: "1"}. Returns a string with html code
	getIndexedVariableHTML (indexedVar) {
		const template = document.getElementById ('workspace_indexed_var_template');
		let copy = template.cloneNode (template, true);
		copy.querySelector (".ws_var").innerHTML = indexedVar.name;
		copy.querySelector (".ws_index").innerHTML = indexedVar.index;
		copy.id = "";
		copy.classList.remove ("template");
		return copy.outerHTML;
	}
}
