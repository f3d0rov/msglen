

class HuffmanCodingAlgo {
	name () {
		return "Хаффман";
	}

	icon () {
		return "/svg/ok.svg";
	}

	work (probabilityList, workspace) {
		console.log (probabilityList);
	}
}


window.addEventListener (
	'load',
	() => {
		registerMethod (new ShannonFanoCodingAlgo());
		registerMethod (new HuffmanCodingAlgo());
	}
);
