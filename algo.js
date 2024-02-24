
class ShannonFanoCodingAlgo {
	name () {
		return "Шеннон-Фано"
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
	}
);
