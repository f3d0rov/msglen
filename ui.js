

class MethodAbstraction {
	name () {
		throw "Not implemented";
	}

	icon () {
		return "res/ok.svg";
	}

	work (probabilityList, workspace) {
		throw "Not implemented";
	}
}


function deepCopy (obj) {
	// This is a fucking atrocity
	return JSON.parse (JSON.stringify (obj));
	// An industry standart too apparently
}


class MessageProbabilityEntry {
	constructor (prev = null, name = "x", focus = true, suggestVal = 0, nextCallback, deleteCallback, checkMessages) {
		this.prev = prev;
		this.next = null;
		if (prev != null) {
			this.next = prev.next;
			prev.next = this;
		}
		
		if (this.prev == null)
			this.index = 1;
		else
			this.index = this.prev.index + 1;

		this.template = document.getElementById ('prob_template');
		
		this.nextCallback = nextCallback;
		this.deleteCallback = deleteCallback;
		this.checkMessagesCallback = checkMessages;

		this.createSelf (name, focus, suggestVal);
		this.name = name;
	}

	createSelf (name, focus, suggestVal) {
		this.elem = this.template.cloneNode (true);
		this.elem.classList.remove ('template');
		this.elem.id = "";

		this.nameElem = this.elem.querySelector (".prob_var");
		this.indexElem = this.elem.querySelector (".prob_index");
		this.inputElem = this.elem.querySelector (".prob_input");
		this.removeButton = this.elem.querySelector (".remove_prob_button");

		this.nameElem.innerHTML = name;
		this.indexElem.innerHTML = this.index;
		this.inputElem.addEventListener ('input', (ev) => {this.checkInput();});
		this.inputElem.addEventListener ('keydown', (ev) => { if (ev.key == "Enter") this.switchToNext();});
		// Delete self if 0
		this.inputElem.addEventListener ('blur', (ev) => { this.onBlur(); } );
		if (suggestVal.equals (new Decimal (0))) {
			this.inputElem.value = "0.0";
		} else {
			this.inputElem.value = suggestVal;
		}
		this.removeButton.addEventListener ('click', () => {this.deleteSelf();});
		
		if (this.prev == null) {
			this.template.parentElement.insertBefore (this.elem, this.template);
		} else {
			this.prev.elem.parentElement.insertBefore (this.elem, this.prev.elem.nextSibling);
		}
		
		if (focus)
			this.focus();
	}

	focus () {
		this.inputElem.focus();
		if (this.inputElem.value.startsWith ("0."))
			this.inputElem.setSelectionRange (2, 30000);
		else
			this.inputElem.select();	
	}

	onBlur () {
		if (this.valueIsValid() && this.value().equals(new Decimal (0))) {
			this.deleteSelf(); // Remove self if 0
			return;
		}
		
		if (this.inputElem.value.trim() == "") {
			this.deleteSelf(); // Remove self if empty
			return;
		}
		
		this.checkMessagesCallback ();
	}

	deleteSelf () {
		if (this.next != null) {
			this.next.prev = this.prev;
			this.next.setIndex (this.index);
		}

		if (this.prev != null) {
			this.prev.next = this.next;
		}

		this.elem.remove();

		if (this.next == null) {
			this.deleteCallback (this.prev);
		}

		this.checkMessagesCallback();
	}

	setIndex (index) {
		this.index = index;
		this.indexElem.innerHTML = this.index;
		this.next?.setIndex (index + 1);
	}

	checkInput () {
		if (this.valueIsValid()) {
			this.inputElem.classList.remove ("bad");
		} else {
			this.inputElem.classList.add ("bad");
		}
		this.checkMessagesCallback();
	}

	switchToNext () {
		if (this.next != null) {
			this.next.focus();
		} else {
			this.nextCallback ();
		}
	}

	value () {
		try {
			return new Decimal (this.inputElem.value);
		} catch {
			return new Decimal (0);
		}
	}

	valueIsValid () {
		let x;
		try {
			x = new Decimal (this.inputElem.value);
		} catch {
			return false; // Can't convert
		}

		// Return false if outside of [0, 1] interval
		if (x.lessThan (new Decimal (0)) || x.greaterThan (new Decimal (1))) {
			return false;
		} else {
			// All good
			return true;
		}
	}

	prevTotal () {
		if (this.prev) {
			return this.value().add (this.prev.prevTotal());
		}
		return this.value();
	}

	getPrevMistake () {
		if (this.valueIsValid()) {
			if (this.prev) {
				return this.prev.getPrevMistake();
			} else {
				return null;
			}
		} else {
			let thisVal;
			try {
				thisVal = new Decimal (this.inputElem.value);
			} catch {
				return { error: "Некорректное значение", obj: this };
			}

			if (thisVal.lessThan (new Decimal (0))) {
				return { error: "Отрицательное значение", obj: this };
			}

			if (thisVal.greaterThan (new Decimal (1))) {
				return { error: "Значение > 1", obj: this };
			}
			
			return { error: "Ошибка", obj: this}; // Hopefully never occurs
		}
	}

	getNameAndIndex () {
		return {
			name: this.name,
			index: this.index
		};
	}

	getProbabilityList () {
		let list = [];
		
		if (this.prev) {
			list = this.prev.getProbabilityList();
		}

		list.push ({
			message: this.getNameAndIndex(),
			probability: this.value()
		});

		return list;
	}
}


class Messages {
	constructor () {
		this.elem = document.getElementById ("probs_box")

		this.addMessageButton = document.getElementById ("add_prob_button");
		this.addMessageButton.addEventListener ('click', () => { this.addMessage(); });

		this.clearMessagesButton = document.getElementById ("clear_messages_button");
		this.clearMessagesButton.addEventListener ('click', () => { this.clearMessages(); });

		this.githubButton = document.getElementById ("github_button");
		this.githubButton.addEventListener ('click', () => { window.open ('https://github.com/f3d0rov/msglen')});

		this.errorMessage = document.getElementById ('error_msg');
		this.errorMessageText = document.getElementById ("error_msg_text");
		this.errorMessage.addEventListener ('click', () => { this.focusErrorSource(); });
		this.errorSource = null;

		this.lastMessage = null;

		this.multiplicationError = document.getElementById ("mult_error_msg");
		this.multiplicationInput = document.getElementById ("symbol_multiply_input");
		this.multiplicationInput.addEventListener ('input', () => { this.checkMultiplication(); });
	}
	
	nextMessage () {
		let currentTotal = this.lastMessage.prevTotal();
		if (currentTotal.equals (new Decimal (1)) == false) this.addMessage ();
		else document.activeElement.blur();
	}

	addMessage (focus = true) {
		let suggestVal = new Decimal (0);

		if (this.lastMessage != null) {
			let currentTotal = this.lastMessage.prevTotal();
			// console.log (`Total: ${currentTotal}`)
			// If current total in (0, 1)
			if (currentTotal.lessThan (new Decimal (1)) && currentTotal.greaterThan (new Decimal (0)))
				suggestVal = new Decimal (1).minus (currentTotal); 
		}

		let newMessage = new MessageProbabilityEntry (
			this.lastMessage,
			"x",
			focus,
			suggestVal,
			() => { this.nextMessage();},
			(last) => { this.setNewRoot(last);},
			() => { this.checkMessages(); }
		);
		this.lastMessage = newMessage;

		this.checkMessages();
	}
	
	clearMessages () {
		while (this.lastMessage != null) {
			this.lastMessage.deleteSelf ();
		}
	}

	setNewRoot (root) {
		this.lastMessage = root;
	}

	checkMessages () {
		if (this.lastMessage == null) {
			this.setMistake ({ error: "Задайте вероятности", obj: null});
			return;
		}

		let lastMistake = this.lastMessage.getPrevMistake();
		if (lastMistake != null) {
			this.setMistake (lastMistake);
			return false;
		} else {
			let total = this.lastMessage.prevTotal ();

			if (total.greaterThan (new Decimal (1))) {
				this.setMistake ({ error: "Общ. вероятность > 1", obj: null });
				return false;

			} else if (total.lessThan (new Decimal (1))) {
				this.setMistake ({ error: "Общ. вероятность < 1", obj: null });
				return false;
			}

			this.resetMistake ();
			return true;
		}
	}

	setMistake (mistake) {
		this.errorSource = mistake.obj;
		this.errorMessageText.innerHTML = mistake.error;
		this.errorMessage.classList.remove ("template");
	}

	resetMistake () {
		this.errorSource = null;
		this.errorMessage.classList.add ("template");
	}

	focusErrorSource () {
		if (this.errorSource != null) this.errorSource.focus();
	}

	addButton (name, icon, action) {
		const template = document.getElementById ("button_template");
		
		let newButton = template.cloneNode (true);
		newButton.id = "";
		newButton.classList.remove ("template");
		newButton.querySelector (".add_prob_button_text").innerHTML = name;
		newButton.querySelector (".prob_edit_icon").setAttribute ("src", icon);
		newButton.addEventListener ("click", action);

		template.parentElement.insertBefore (newButton, template);
	}

	setMultiplicationError (enable = true) {
		if (enable) {
			this.multiplicationError.classList.remove ("template");
		} else {
			this.multiplicationError.classList.add ("template");
		}
	}

	checkMultiplication () {
		let v = this.multiplicationInput.value;

		if (v == '') {
			this.setMultiplicationError();
			return false;
		}

		for (let i of v) if (i < '0' || i > '9') {
				this.multiplicationInput.classList.add ("bad");
				this.setMultiplicationError ();
				return false;
		}

		let intVal = parseInt (v);

		if (intVal < 1) {
			this.multiplicationInput.classList.add ("bad");
			this.setMultiplicationError();
			return false;
		}

		this.multiplicationInput.classList.remove ("bad");
		this.setMultiplicationError (false);
		return true;
	}

	getMultiplication () {
		if (this.checkMultiplication()) return parseInt (this.multiplicationInput.value);
		return null;
	}

	flatListMultiplication (a, b) {
		let result = []
		let varName = 'y';
		let indexCounter = 1;
		for (let i of a) {
			for (let j of b) {
				result.push (
					{
						message: {
							name: varName,
							index: indexCounter++
						},
						probability: i.probability.times (j.probability)
					}
				);
			}
		}
		return result;
	}

	raiseProbabilityListToPower (pl, power) {
		if (power == 0) return [];
		if (power == 1) return pl;

		let result = deepCopy (pl);
		for (let i of result) {
			i.probability = new Decimal (i.probability);
		}

		for (let i = 1; i < power; i++) {
			result = this.flatListMultiplication (result, pl);
		}
		
		return result;
	}

	getProbabilityList () {
		if (this.lastMessage == null) return [];
		if (this.checkMultiplication() == false) {
			return [];
		}
		let probList = this.lastMessage.getProbabilityList();
		let power = this.getMultiplication();
		return this.raiseProbabilityListToPower (probList, power);
	}

	showSelf () {
		this.elem.classList.remove ("mobile_out_of_focus");
	}

	hideSelf () {
		this.elem.classList.add ("mobile_out_of_focus");
	}
}


class AlgoUI {
	constructor () {
		this.messages = new Messages;
		this.workspace = new Workspace;
	}

	registerMethod (method) {
		this.messages.addButton (method.name(), method.icon(), () => { this.callMehtod (method); });
	}

	async callMehtod (method) {
		if (this.messages.checkMessages()) {
			this.workspace.clear();
			this.switchToWorkspace();
			await this.workspace.loading();
			this.doWork (method).then (
				() => {
					this.workspace.loaded();
				}
			);
		}
	}

	switchToWorkspace () {
		this.messages.hideSelf();
		this.workspace.showSelf (
			() => {
				this.switchToProbs();
			}
		);
	}

	switchToProbs () {
		this.workspace.hideSelf();
		this.messages.showSelf();
	}

	async doWork (method) {
		method.work (this.messages.getProbabilityList(), this.workspace);
	}
}

var algoUI;

function setupUI () {
	algoUI = new AlgoUI;
}

async function waitForAlgoUI () {
	do {
		if (algoUI != undefined) return;
		await new Promise (resolve => setTimeout (resolve, )); // Wait for 10ms
	} while (1);
}

async function registerMethod (method) {
	await waitForAlgoUI();
	algoUI.registerMethod (method);
}

window.addEventListener (
	'load',
	setupUI
);
