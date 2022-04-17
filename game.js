var numbers = [];
var cards_total;
var cards_left;
var lives_left;
var gameover;
var current_number = 0;
var cooldown = false;

var userprefs = {
	// darkmode: true,
};

var settings = {
	width: 4,
	height: 4,
	lives: 3,
	extra_pool: 0,
	show_pool: false,
};

if (window.matchMedia && !window.matchMedia("(prefers-color-scheme: dark)").matches) {
	// light mode
	userprefs.darkmode = false;
	$("body").removeClass("darkmode");
} else {
	// dark mode
	userprefs.darkmode = true;
	$("body").addClass("darkmode");
}

$(document).ready(function () {
	newGame();
});

function newGame(seed = Math.random()) {
	cards_total = settings.width * settings.height;
	var numbers_highest = cards_total + settings.extra_pool;
	var numbers_pool = [];

	for (let i = 1; i < numbers_highest + 1; i++) {
		numbers_pool.push(i);
	}

	numbers = numbers_pool;

	shuffleArray(numbers, seed);

	gameover = false;
	cards_left = numbers.length;
	current_number = 0;
	cooldown = false;

	// populate lives
	var life_html = `
	<div class="life">
	<svg class="heart-outline" xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z"/></svg>
	<div class="heart"></div>
	</div>`;
	lives_left = settings.lives;

	var lives = $(".lives");
	lives.empty();
	for (let i = 0; i < lives_left; i++) {
		lives
			.append(life_html)
			.find("div:last-child .heart")
			.css({ "animation-delay": `${i * 100}ms` });
	}

	// populate cards
	var center = $(".center");
	center.empty();
	center.addClass("first-pick");
	center.css({ "grid-template": `repeat(${settings.height}, 1fr) / repeat(${settings.width}, 1fr)` });
	$.each(numbers, function (index, num) {
		var card_html = `
		<div class="card" id="card-${index}" data-x="${index % settings.width}" data-y="${Math.floor(index / settings.width)}" data-index="${index}">
			<div class="higher">
				<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#ffffff"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7.41 15.41L12 10.83l4.59 4.58L18 14l-6-6-6 6 1.41 1.41z"/></svg>
			</div>
			<span>OR</span>
			<div class="lower">
				<svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#ffffff"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z"/></svg>
			</div>
		</div>`;
		center.append(card_html);
	});

	// populate sums
	$(".sums").empty();
	for (let i = 0; i < settings.width; i++) {
		var col_html = `<div class="label" id="sum-col-${i}">${calcColSum(i)}</div>`;
		$(".sums.cols").append(col_html);
	}

	for (let i = 0; i < settings.height; i++) {
		var row_html = `<div class="label" id="sum-row-${i}">${calcRowSum(i)}</div>`;
		$(".sums.rows").append(row_html);
	}
}
// First pick
$(document).on("click", ".center.first-pick .card", function () {
	if (!cooldown) {
		setTimeout(function () {
			$(".center").removeClass("first-pick");
		}, 250);

		var card = $(this).closest(".card");
		card.addClass("correct");
		flipCard(card);

		$(".card").css({
			"animation-name": "flipCardLeft",
		});
		card.css({
			"animation-name": "flipCardLeft, flipCardColor",
		});
	}
});

// Hover arrows
$(document).on("mouseenter", ".center:not(.first-pick) .card div", function () {
	var card = $(this).closest(".card");

	if ($(this).hasClass("higher")) {
		card.find("span").text("HIGHER");
	} else if ($(this).hasClass("lower")) {
		card.find("span").text("LOWER");
	}
});
$(document).on("mouseleave", ".center:not(.first-pick) .card div", function () {
	var card = $(this).closest(".card");
	card.find("span").text("OR");
});

// Guess
$(document).on("click", ".center:not(.first-pick) .card:not(.flipped) div", function () {
	if (!cooldown && !gameover) {
		cooldown = true;
		var card = $(this).closest(".card");
		var card_index = card.data("index");
		var card_number = numbers[card_index];

		var guess_higher;
		if ($(this).hasClass("higher")) {
			guess_higher = true;
		} else if ($(this).hasClass("lower")) {
			guess_higher = false;
		} else {
			return;
		}

		var guess_correct = false;
		if (guess_higher) {
			if (current_number < card_number) {
				guess_correct = true;
			}
		} else {
			if (current_number > card_number) {
				guess_correct = true;
			}
		}

		if (guess_correct) {
			card.addClass("correct");
		} else {
			card.addClass("wrong");
			lives_left--;
			$(".lives .life:not(.lost)").last().addClass("lost").find(".heart").css({ "animation-delay": "" });
		}

		// Check if gameover
		if (lives_left <= 0) {
			gameover = true;
		} else {
			setTimeout(function () {
				cooldown = false;
			}, 400);
		}

		// Flip
		card.css({
			"animation-name": `flipCardColor, flipCard${guess_higher ? "Up" : "Down"}`,
		});
		flipCard(card);

		// Lose + Win
		if (gameover) {
			setTimeout(function () {
				openModal();
				$(".modal-stats .modal-title").text("You lost!");
				$(".modal-stats").show();
			}, 1000);
		} else if (cards_left <= 0) {
			setTimeout(function () {
				openModal();
				$(".modal-stats .modal-title").text("You won!");
				$(".modal-stats").show();
			}, 1000);
		}
	}
});

function flipCard(card) {
	cards_left--;

	var card_index = card.data("index");
	var card_number = numbers[card_index];
	var card_x = card.data("x");
	var card_y = card.data("y");

	current_number = card_number;

	$(".card").removeClass("active");

	setTimeout(function () {
		card.addClass("flipped");
		if (cards_left > 0 && !gameover) {
			card.addClass("active");
		}
		card.html(card_number);
	}, 250);

	setTimeout(function () {
		$(`.sums.rows .label#sum-row-${card_y}`).text(calcRowSum(card_y)).addClass("jump");
		$(`.sums.cols .label#sum-col-${card_x}`).text(calcColSum(card_x)).addClass("jump");
		setTimeout(() => {
			$(`.sums .label`).removeClass("jump");
		}, 500);
	}, 400);
}

// Reset
$(document).on("click", ".btn-restart", function () {
	newGame();

	if (!$(this).hasClass("spin")) {
		$(this).addClass("spin");
		setTimeout(() => {
			$(this).removeClass("spin");
		}, 600);
	}
});

// Get index
function getRowIndexArray(row_pos) {
	var row_numbers = [];
	$(`.card[data-y=${row_pos}]`).each(function (index) {
		if (!$(this).hasClass("flipped")) {
			row_numbers.push($(this).data("index"));
		}
	});
	return row_numbers;
}
function getColIndexArray(col_pos) {
	var col_numbers = [];
	$(`.card[data-x=${col_pos}]`).each(function (index) {
		if (!$(this).hasClass("flipped")) {
			col_numbers.push($(this).data("index"));
		}
	});
	return col_numbers;
}

// Calc sums
function calcRowSum(row_pos) {
	var row_numbers = getRowIndexArray(row_pos);
	// console.log("row: " + row_numbers);
	return sumArray(row_numbers);
}
function calcColSum(col_pos) {
	var col_numbers = getColIndexArray(col_pos);
	// console.log("col: " + row_numbers);
	return sumArray(col_numbers);
}
function sumArray(array) {
	var total = 0;
	$.each(array, function (i, value) {
		total += numbers[value] << 0;
	});
	return total;
}

// Shuffle
function shuffleArray(array, seed = Math.random()) {
	var m = array.length,
		t,
		i;

	while (m) {
		// Pick a remaining element…
		i = Math.floor(random(seed) * m--);

		// And swap it with the current element.
		t = array[m];
		array[m] = array[i];
		array[i] = t;
		++seed;
	}

	return array;
}
function random(seed) {
	var x = Math.sin(seed++) * 10000;
	return x - Math.floor(x);
}

// Modal

function openModal() {
	$(".modal-content").hide();
	$(".modal").show();
}
function closeModal() {
	$(".modal").hide();
}

// Modal - Open
$(document).on("click", ".btn-info", function () {
	openModal();
	$(".modal-info").show();
});

$(document).on("click", ".btn-stats", function () {
	openModal();
	$(".modal-stats .modal-title").text("Statistics");
	$(".modal-stats").show();
});

$(document).on("click", ".btn-settings", function () {
	openModal();
	$(".modal-settings").show();
});

// Modal - Close
$(document).on("click", ".modal .btn-close", function (e) {
	closeModal();
});

$(document).on("click", ".modal", function (e) {
	if (e.target != this) return;
	closeModal();
});

$(document).on("keydown", function (e) {
	if (e.key == "Escape") {
		closeModal();
	}
});

// Settings

$(document).on("click", ".settings-darkmode", function () {
	$("body").toggleClass("darkmode");
});
