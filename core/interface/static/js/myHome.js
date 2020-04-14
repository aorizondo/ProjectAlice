$(document).tooltip();

$(function () {

	let $floorPlan = $('#floorPlan');
	let editMode = false;

	let moveMode = false;
	let zoneMode = false;
	let buildingMode = false;
	let paintingMode = false;

	let selectedTexture = '';

	function loadHouse() {
		$.ajax({
			url : '/myhome/load/',
			type: 'GET'
		}).done(function(response) {
			let $data = JSON.parse(response);
			$.each($data, function (i, zone) {
				let $zone = newZone(zone);
				$.each(zone['walls'], function(ii, wall) {
					newWall($zone, wall);
				});
			})
		});
	}

	function saveHouse() {
		let data = {};
		$floorPlan.children('.floorPlan-Zone').each(function () {
			let zoneName = $(this).data('name');
			data[zoneName] = {
				'name'   : $(this).data('name'),
				'x'      : $(this).position().left,
				'y'      : $(this).position().top,
				'width'  : $(this).width(),
				'height' : $(this).height(),
				'texture': $(this).data('texture')
			};

			data[zoneName]['walls'] = [];
			$(this).children('.floorPlan-Wall').each(function() {
				data[zoneName]['walls'].push({
					'x'      : $(this).position().left,
					'y'      : $(this).position().top,
					'width'  : $(this).width(),
					'height' : $(this).height()
				})
			});
		});

		$.ajax({
			url : '/myhome/',
			type: 'PUT',
			data: {
				'data': JSON.stringify(data)
			}
		});
	}

	function newZone(data) {
		let left = data['x'] - data['x'] % 5;
		let top = data['y'] - data['y'] % 5;
		let $newZone = $('<div class="floorPlan-Zone ' + data["texture"] + '" ' +
			'data-name="' + data["name"] + '" ' +
			'data-texture="' + data["texture"] + '" ' +
			'style="width: ' + data["width"] + 'px; height: ' + data["height"] + 'px; position: absolute; ">' +
			'<div>' + data["name"] + '</div>' +
			'</div>');

		$newZone.offset({left: left, top: top});
		$newZone.resizable({
			containment: 'parent',
			grid: [5, 5]
		}).draggable({
			containment: 'parent',
			cursor: 'move',
			distance: 10,
			grid: [5, 5],
			snap: true,
			snapTolerance: 5,
			zIndex: 9999
		});

		$newZone.resizable('disable').draggable('disable');

		$newZone.on('click touchstart', function () {
			if (buildingMode) {
				let wallData = {
					'x': 50,
					'y': 50,
					'width': 25,
					'height': 75
				}
				let wall = newWall($newZone, wallData);
				wall.resizable('enable').draggable('enable');
			} else if (paintingMode) {
				$newZone.attr('class', 'floorPlan-Zone');
				$newZone.addClass(selectedTexture);
				$newZone.attr('data-texture', selectedTexture);
			}
		});

		$newZone.on('contextmenu', function () {
			if (moveMode) {
				let result = confirm('Do you really want to delete this zone?');
				if (result == true) {
					$(this).remove();
				}
				return false;
			}
		});

		$floorPlan.append($newZone);
		return $newZone;
	}

	function newWall($element, data) {
		let $newWall = $('<div class="floorPlan-Wall" ' +
			'style="width: ' + data["width"] + 'px; height: ' + data["height"] + 'px; position: absolute; z-index: auto;">' +
			'</div>');

		$newWall.offset({left: data['x'], top: data['y']});

		$newWall.resizable({
			containment: 'parent',
			grid       : [5, 5]
		}).draggable({
			containment: 'parent',
			cursor: 'move',
			distance: 10,
			grid: [5, 5],
			snap: true,
			snapTolerance: 5,
			zIndex: 9999
		});

		$newWall.resizable('disable').draggable('disable');

		$newWall.on('click touchstart', function () {
			return false;
		});

		$newWall.on('contextmenu', function () {
			if (buildingMode) {
				$(this).remove();
				return false;
			}
		});

		$element.append($newWall);
		return $newWall;
	}

	$('#toolbarToggleShow').on('click touchstart', function () {
		$('#toolbar_full').show();
		$('#toolbar_toggle').hide();
		$floorPlan.addClass('floorPlanEditMode');
		editMode = true;
		zoneMode = false;
		buildingMode = false;
		paintingMode = false;
		$('#painterTiles').hide();
	});

	$('#toolbarToggleHide').on('click touchstart', function () {
		$('#toolbar_full').hide();
		$('#toolbar_toggle').show();
		editMode = false;
		zoneMode = false;
		buildingMode = false;
		paintingMode = false;
		$floorPlan.removeClass('floorPlanEditMode');
		$floorPlan.removeClass('floorPlanEditMode-AddingZone');

		$('.floorPlan-Zone').draggable('disable').resizable('disable');
		$('.floorPlan-Wall').draggable('disable').resizable('disable');

		markSelectedTool(null);
		saveHouse();
	});

	$('#addZone').on('click touchstart', function () {
		if (!editMode) {
			return;
		}
		zoneMode = true;
		buildingMode = false;
		moveMode = false;
		paintingMode = false;
		markSelectedTool($(this));
		$('#floorPlan').addClass('floorPlanEditMode-AddingZone');
	});

	$floorPlan.on('click touchstart', function (e) {
		if (!zoneMode) {
			return;
		}

		let zoneName = prompt('Please name this new zone');
		if (zoneName != null && zoneName != '') {
			let data = {
				'name': zoneName,
				'x'    : e.pageX - $(this).offset().left,
				'y'    : e.pageY - $(this).offset().top,
				'width'   : 100,
				'height'  : 100,
				'texture' : ''
			}
			let $zone = newZone(data);
			$zone.resizable('enable').draggable('enable');
		}

		zoneMode = false;
		markSelectedTool(null);
		$(this).removeClass('floorPlanEditMode-AddingZone');
	});

	function markSelectedTool($element) {
		$('.selectedTool').removeClass('selectedTool');

		if ($element != null) {
			$element.addClass('selectedTool');
		}
	}

	$('#builder').on('click touchstart', function () {
		paintingMode = false;
		moveMode = false
		zoneMode = false;
		$('#painterTiles').hide();

		markSelectedTool($(this));

		if (!buildingMode) {
			buildingMode = true;
			$floorPlan.removeClass('floorPlanEditMode-AddingZone');

			$('.floorPlan-Wall').resizable('enable').draggable('enable');
		} else {
			buildingMode = false;
			$('.floorPlan-Zone').draggable('enable').resizable('enable');
			$('.floorPlan-Wall').resizable('disable').draggable('disable');
		}
	});

	$('#painter').on('click touchstart', function () {
		buildingMode = false;
		moveMode = false;
		zoneMode = false;

		markSelectedTool($(this));

		if (!paintingMode) {
			paintingMode = true;
			$floorPlan.removeClass('floorPlanEditMode-AddingZone');
			$('.floorPlan-Zone').draggable('disable').resizable('disable');
			$('#painterTiles').css('display', 'flex');
		} else {
			paintingMode = false;
			$('#painterTiles').hide();
			$('.floorPlan-Zone').draggable('enable').resizable('enable');
		}
	});

	$('#mover').on('click touchstart', function () {
		buildingMode = false;
		paintingMode = false;
		zoneMode = false;
		$('#painterTiles').hide();

		markSelectedTool($(this));

		if (!moveMode) {
			moveMode = true;
			$('.floorPlan-Zone').draggable('enable').resizable('enable');
		} else {
			moveMode = false;
			$('.floorPlan-Zone').draggable('disable').resizable('disable');
		}
	});

	for (let i = 1; i <= 2; i++) {
		let $tile = $('<div class="floorPlan-Zone-tile floor-' + i + '"></div>')

		$tile.on('click touchstart', function () {
			if (!$(this).hasClass('selected')) {
				$('.floorPlan-Zone-tile').removeClass('selected');
				$(this).addClass('selected');
				selectedTexture = 'floor-' + i;
			} else {
				$(this).removeClass('selected');
			}
		})

		$('#painterTiles').append($tile);
	}

	loadHouse();
});