 $(document).ready(function(){
	var STORAGE_KEY = 'goalslist',
		LOG_KEY = 'log';

	var goalTemplate = Handlebars.compile($('#goal-template').html()),
		logEntryTemplate = Handlebars.compile($('#log-entry-template').html()),
		logGoalTemplate = Handlebars.compile($('#log-goal-template').html()),
		categoryTemplate = Handlebars.compile($('#category-template').html());

	var goalsIndex = 0,
		goalsCompleted = 0,
		categoryCount = 0, 
		startingCatCount = 4;


	/* INIT ----------------------------------------------------*/

	setCategoryCount();
	createDefaultCategories();
	displaySettings();
	displayStoredGoals();
	displayLog();

	// set categoryCount to saved count
	function setCategoryCount(){
		if (localStorage && 'settings' in localStorage){
			var settings = JSON.parse(localStorage.getItem('settings'));
			if (settings && settings['categoryCount'] !== undefined){
				startingCatCount = settings['categoryCount'];
			}
		}	
	}

	function createDefaultCategories(){
		for (var i = 1; i <= startingCatCount; i++){
			categoryCount++;
			addCategoryFormField();
			addCategory();
		}
	}

	function addCategoryFormField(){
		// add category input field to settings form
		$('#form-categories').append('<label for="cat-' + categoryCount + '"">Goal Category ' + categoryCount + '</label>' + 
                '<input type="text" name="cat-' + categoryCount + '" id="cat-' + categoryCount + '" placeholder="e.g. Health, Career, Finances" />');
	}

	function addCategory(){
		$('#categories').append(categoryTemplate({
			sectionID: 'cat-section-' + categoryCount,
			titleID: 'cat-title-' + categoryCount,
			categoryName: 'Category ' + categoryCount
		}));
	}

	function displaySettings(){
		// get settings from local storage and display
		if (localStorage && 'settings' in localStorage){
			var settings = JSON.parse(localStorage.getItem('settings'));

			if (settings){
				var i = 0;
				for (key in settings){
					if (settings[key] && !isBlank(settings[key]) && settings[key] !== "undefined"){
						$('#' + key).text(settings[key]);
					}
				}
			}
			
			// clear goals category select menu
			$('#category-select').html("");

			for (var i = 1; i <= categoryCount; i++){
				var catTitle = $('#cat-title-' + i).text();

				// add category to the goals category select menu
				$('#category-select').append('<option value="cat-section-' + i + '">' + catTitle + '</option>');
				// populate the settings form input field for the category with the category name
				$('#cat-' + i).val(catTitle);
			}
			// populate the remaining settings form input fields with stored data
			$('#year').val(settings['review-year']);
			$('#theme').val(settings['review-theme']);
		}
	}

	function displayStoredGoals(){
		if (localStorage && STORAGE_KEY in localStorage){
			var storedGoals = JSON.parse(localStorage.getItem(STORAGE_KEY));
			
			if (storedGoals){
				for (key in storedGoals){
					(storedGoals[key] && !isBlank(storedGoals[key]) && storedGoals[key] !== "undefined") ? $('#' + key + ' .goals').html(storedGoals[key]) : "";
				}
				if (!isBlank(storedGoals['index'])){
					goalsIndex = storedGoals['index'];
				}
				if (!isBlank(storedGoals['numCompleted'])){
					goalsCompleted = storedGoals['numCompleted'];
				}
			}
		}
	}

	function displayLog(){
		// display saved log entries
		if (localStorage && LOG_KEY in localStorage){
			$('#log-content').html(localStorage.getItem(LOG_KEY));
		}

		// show total # goals completed
		$('#total-completed').html(goalsCompleted);

		// show log entry counts for each goal with logging enabled
		displayLogEntryCounts();
		displaySums();
	}

	function displayLogEntryCounts(){
		$('.log-goal').each(function(){
			var numEntries = 0;

			$('li', this).each(function(){
				numEntries++;
			});

			$('.total-logged', this).text('Total logged: ' + numEntries);
		});
	}

	function displaySums(){
		$('.log-goal').each(function(){
			var sum = 0;

			// calculate the sum
			$('li', this).each(function(){
				sum += parseFloat($(this).text());
			});

			// display the sum with correct units
			var unit = $(this).attr('data-unit');
			$('.sum', this).text('Total ' + unit + ' completed: ' + sum);
		});
	}

	/* ADD/REMOVE GOALS -----------------------------------------------*/

	// show-hide settings form
	$('.goals-toggle').click(function(){
		$('#goal-form').toggle("slow");
	});

	$('#goal-form .cancel').click(function(){
		$('#goal-form').hide("slow");
	})

	// show the units input if Sum Log Entries is checked
	$('#sum-entries').change(function(){
		$('#unit-container').toggle();
	});

	// add a new goal to a category
	$('#goal-form').submit(function(){
		var newGoal = $('#new-goal').val(),
			deadline = $('#deadline-input').val(),
			notes = $('#goal-notes').val(),
			categorySection = $('#category-select option:selected').val();

		var loggingEnabled = $('#enable-logging').prop('checked'),
			sumEntriesEnabled= $('#sum-entries').prop('checked');

		sumEntriesEnabled ? (unit = $('#unit').val()) : "";

		if (!isBlank(newGoal)){ //TODO error checking for blank category and blank new goals on submit
			goalsIndex++;

			// append goal to selected category
			var goalsContainer = $('#' + categorySection + ' .goals')

			goalsContainer.append(goalTemplate({
												goal: newGoal,
												deadline: deadline,
												notes: notes,
												loggingEnabled: loggingEnabled,
												index: goalsIndex,
												unit: unit
											}));

			// clear the text input boxes
			$('#new-goal').val("");
			$('#deadline-input').val("");
			$('#goal-notes').val("");

			localStorage.setItem(STORAGE_KEY, JSON.stringify(setGoals()));
			
			$('#goal-form').hide("slow");
		}

		// add the goal title to the log section, if logging enabled
		if (loggingEnabled){
			$('#log-content').append(logGoalTemplate({
														goal: newGoal,
														index: goalsIndex,
														sumEntriesEnabled: sumEntriesEnabled,
														unit: unit
													}));

			// save the log
			localStorage.setItem(LOG_KEY, $('#log-content').html());

			// display initial logged entries count
			displayLogEntryCounts();

			// display initial sum of entered log values
			if (sumEntriesEnabled){
				displaySums();
			}
		}

		return false;
	});

	function setGoals(){
		var goals = {};
		for (var i = 1; i <= categoryCount; i++){
			goals['cat-section-' + i] = $('#cat-section-' + i + ' .goals').html();
		}
		goals['index'] = goalsIndex;
		goals['numCompleted'] = goalsCompleted;
		return goals;
	}

	// delete goal
	$(document).on('click', '.delete', function(){
		$(this).parent().remove();
		localStorage.setItem(STORAGE_KEY, JSON.stringify(setGoals()));
	});

	// click to edit goal information
	$(document).on('click', '.deadline, .goal-title, .notes', function(){
		var fieldClass = $(this).attr('class');
		var currentValue = $(this).text();

		// prevent completed goals from being edited
		if ($('.goal-title').css('text-decoration') === 'line-through'){
			return;
		}

		if (fieldClass === 'notes'){
			$(this).replaceWith('<textarea id="new-' + fieldClass + '" autofocus>' + currentValue + '</textarea>');
		} else {
			$(this).replaceWith("<input type='text' name='new-" + fieldClass + "' id='new-" + fieldClass + "' value='" + currentValue + "' autofocus/>");
		}
	});

	// save goal information
	$(document).on('blur', '#new-deadline, #new-goal-title, #new-notes', function(){
		var newVal = $(this).val(),
			inputID = $(this).attr('id');

		if (inputID === 'new-deadline'){
			// replace with the original html
			$(this).replaceWith('<div class="deadline">' + newVal + '</div>');
		} else if (inputID === 'new-goal-title'){
			$(this).replaceWith('<h3 class="goal-title">' + newVal + '</h3>');
		} else if (inputID === 'new-notes'){
			$(this).replaceWith('<p class="notes">' + newVal + '</p>');
		}

		// save edits
		localStorage.setItem(STORAGE_KEY, JSON.stringify(setGoals()));
	});

	/* SETTINGS FORM ------------------------------------------*/

	// show-hide settings form
	$('.settings-toggle').click(function(){
		$('#settings-form').toggle("slow");
	});

	$('#settings-form .cancel').click(function(){
		$('#settings-form').hide("slow");
	});

	// Add category to settings form
	$('#add-cat').click(function(){
		categoryCount++;
		addCategoryFormField();
	});

	// submit settings form changes
	$('#settings-form').submit(function(){
		settings = {
						'review-year': $('#year').val(),
						'review-theme': $('#theme').val()
					}
		
		// create any added categories
		for (var i = startingCatCount; i < categoryCount; i++){
			addCategory();
			startingCatCount = categoryCount;
		}

		// add all categories to settings object
		for (var i = 1; i <= categoryCount; i++){
			settings['cat-title-' + i] = $('#cat-' + i).val();
		}

		// add total number of categories to settings object
		settings['categoryCount'] = categoryCount;

		// save settings object
		localStorage.setItem('settings', JSON.stringify(settings));
		displaySettings();

		$('#settings-form').hide("slow");

		return false;
	});

	// complete a goal
	$(document).on('click', '.complete', function(){
		// get current date to display
		var currentDate = new Date();
		var dd = currentDate.getDate();
		var mm = currentDate.getMonth()+1;
		var yyyy = currentDate.getFullYear();

		var parentGoal = $(this).parent();

		// strike out the goal title
		$('.goal-title', parentGoal).css('text-decoration', 'line-through');
		
		// display date completed
		if (isBlank($('.date', parentGoal).text())){
			$('.date', parentGoal).text(mm + '/' + dd + '/' + yyyy);
		}

		// change the button class
		$(this).addClass('undo-complete');
		$(this).removeClass('complete');

		goalsCompleted++;

		// display new total completed in log panel
		$('#total-completed').html(goalsCompleted);

		// save changes
		localStorage.setItem(STORAGE_KEY, JSON.stringify(setGoals()));
	});

	// undo goal completion
	$(document).on('click', '.undo-complete', function(){
		var parentGoal = $(this).parent();

		// remove strikethrough line
		$('.goal-title', parentGoal).css('text-decoration', 'none');

		// remove date completed
		$('.date', parentGoal).text("");

		// change the button class
		$(this).removeClass('undo-complete');
		$(this).addClass('complete');

		goalsCompleted--;
		// display new total completed in log panel
		$('#total-completed').html(goalsCompleted);

		// save changes
		localStorage.setItem(STORAGE_KEY, JSON.stringify(setGoals()));
	});

	/* GOAL LOGGING ---------------------------------------------*/

	$(document).on('click', '.add-log-entry', function(){
		var parentGoal = $(this).parent();

		// prevent actions from occurring twice
		if(!$.trim( $('.logging', parentGoal).html()).length){
			var unit = parentGoal.attr('data-unit');
			// create input box and save button
			$('.logging', parentGoal).append(logEntryTemplate({unit: unit}));
		}
	});

	$(document).on('click', '.logging .cancel', function(){
		removeLogInputField($(this).parent());
	});

	$(document).on('click', '.save-log-entry', function(){
		var parent = $(this).parent();
		var parentGoalID = parent.parent().attr('id');
		var parentGoalIndex = parentGoalID.substring(5);
		var text = $('.log-input', parent).val();

		if (!isBlank(text)){
			$('#log-goal-' + parentGoalIndex + ' .log-list').append('<li>' + text + '</li>');

			// save the log
			localStorage.setItem(LOG_KEY, $('#log-content').html());
		}


		// display initial logged entries count
		displayLogEntryCounts();

		// display initial sum if sum entries is enabled
		if ($('#log-goal-' + parentGoalIndex).hasClass("sum-entries")){
			displaySums();
		}

		removeLogInputField(parent);
	});

	function removeLogInputField(parent){
		$(parent).children().each(function(){
			$(this).remove();
		});
	}

	/* DISPLAY LOG ---------------------------------------------*/

	$('#log-toggle').click(function(){
		$('#log-content').toggle("slow");
	});

	/* HELPER METHODS ---------------------------------------------*/

	function isBlank(str) {
	    return (!str || /^\s*$/.test(str));
	}

});