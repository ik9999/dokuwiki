/*jslint devel: true, bitwise: true, regexp: true, browser: true, confusion: true, unparam: true, eqeq: true, white: true, nomen: true, plusplus: true, maxerr: 50, indent: 4 */
/*globals jQuery */

/*!
 * Tristate v1.2.1
 *
 * Copyright (c) 2013-2017 Martijn W. van der Lee
 * Licensed under the MIT.
 */
/* Based on work by:
 *  Chris Coyier (http://css-tricks.com/indeterminate-checkboxes/)
 *
 * Tristate checkbox with support features
 * pseudo selectors
 * val() overwrite
 */

;(function($, undefined) {
	'use strict';

	var pluginName = 'tristate',
		defaults = {
			'change':			undefined,
			'checked':			undefined,
			'indeterminate':	undefined,
			'init':				undefined,
			'reverse':			false,
			'state':			undefined,
			'unchecked':		undefined,
			'value':			undefined	// one-way only!
		},
		valFunction	= $.fn.val;

    function Plugin(element, options) {
        if($(element).is(':checkbox')) {
            this.element = $(element);
            this.settings = $.extend( {}, defaults, options );
            this._create();
        }
    }

    $.extend(Plugin.prototype, {
		_create: function() {
			var that = this,
				state;

			// Fix for #1
			if (window.navigator.userAgent.indexOf('Trident') >= 0) {
				this.element.click(function(e) {
					that._change.call(that, e);
					that.element.closest('form').change();
				});
			} else {
				this.element.change(function(e) {
					that._change.call(that, e);
				});
			}

			this.settings.checked		= this.element.attr('checkedvalue')		  || this.settings.checked;
			this.settings.unchecked		= this.element.attr('uncheckedvalue')	  || this.settings.unchecked;
			this.settings.indeterminate	= this.element.attr('indeterminatevalue') || this.settings.indeterminate;

			// Initially, set state based on option state or attributes
			if (typeof this.settings.state === 'undefined') {
				this.settings.state		= typeof this.element.attr('indeterminate') !== 'undefined'? null : this.element.is(':checked');
			}

			// If value specified, overwrite with value
			if (typeof this.settings.value !== 'undefined') {
				state = this._parseValue(this.settings.value);
				if (typeof state !== 'undefined') {
					this.settings.state = state;
				}
			}

			this._refresh(this.settings.init);

			return this;
		},

		_change: function(e) {
			if (e.isTrigger || !e.hasOwnProperty('which')) {
				e.preventDefault();
			}

			switch (this.settings.state) {
				case true:  this.settings.state = (this.settings.reverse ? false : null); break;
				case false: this.settings.state = (this.settings.reverse ? null : true); break;
				default:    this.settings.state = (this.settings.reverse ? true : false); break;
			}

			this._refresh(this.settings.change);
		},

		_refresh: function(callback) {
			var value	= this.value();

			this.element.data("vanderlee." + pluginName, value);

			this.element[this.settings.state === null ? 'attr' : 'removeAttr']('indeterminate', 'indeterminate');
			this.element.prop('indeterminate', this.settings.state === null);
			this.element.get(0).indeterminate = this.settings.state === null;

			this.element[this.settings.state === true ? 'attr' : 'removeAttr']('checked', true);
			this.element.prop('checked', this.settings.state === true);

			if ($.isFunction(callback)) {
				callback.call(this.element, this.settings.state, this.value());
			}
		},

		state: function(value) {
			if (typeof value === 'undefined') {
				return this.settings.state;
			} else if (value === true || value === false || value === null) {
				this.settings.state = value;

				this._refresh(this.settings.change);
			}
			return this;
		},

		_parseValue: function(value) {
			if (value === this.settings.checked) {
				return true;
			} else if (value === this.settings.unchecked) {
				return false;
			} else if (value === this.settings.indeterminate) {
				return null;
			}
		},

		value: function(value) {
			if (typeof value === 'undefined') {
				var value;
				switch (this.settings.state) {
					case true:
						value = this.settings.checked;
						break;

					case false:
						value = this.settings.unchecked;
						break;

					case null:
						value = this.settings.indeterminate;
						break;
				}
				return typeof value === 'undefined'? this.element.attr('value') : value;
			} else {
				var state = this._parseValue(value);
				if (typeof state !== 'undefined') {
					this.settings.state = state;
					this._refresh(this.settings.change);
				}
			}
		}
	});

	$.fn[pluginName] = function (options, value) {
		var result = this;

		this.each(function() {
            if (!$.data(this, "plugin.vanderlee." + pluginName)) {
                $.data(this, "plugin.vanderlee." + pluginName, new Plugin(this, options));
            } else if (typeof options === 'string') {
				if (typeof value === 'undefined') {
					result = $(this).data("plugin.vanderlee." + pluginName)[options]();
					return false;
				} else {
					$(this).data("plugin.vanderlee." + pluginName)[options](value);
				}
			}
        });

		return result;
	};

	// Overwrite fn.val
    $.fn.val = function(value) {
        var data = this.data("vanderlee." + pluginName);
        if (typeof data === 'undefined') {
	        if (typeof value === 'undefined') {
	            return valFunction.call(this);
			} else {
				return valFunction.call(this, value);
			}
		} else {
	        if (typeof value === 'undefined') {
				return data;
			} else {
				this.data("vanderlee." + pluginName, value);
				return this;
			}
		}
    };

	// :indeterminate pseudo selector
    $.expr.filters.indeterminate = function(element) {
		var $element = $(element);
		return typeof $element.data("vanderlee." + pluginName) !== 'undefined' && $element.prop('indeterminate');
    };

	// :determinate pseudo selector
    $.expr.filters.determinate = function(element) {
		return !($.expr.filters.indeterminate(element));
    };

	// :tristate selector
    $.expr.filters.tristate = function(element) {
		return typeof $(element).data("vanderlee." + pluginName) !== 'undefined';
    };
})(jQuery);


/**
 * @date 20130405 Leo Eibler <dokuwiki@sprossenwanne.at> \n
 *                replace old sack() method with new jQuery method and use post instead of get - see https://www.dokuwiki.org/devel:jqueryfaq \n
 * @date 20130407 Leo Eibler <dokuwiki@sprossenwanne.at> \n
 *                use jQuery for finding the elements \n
 * @date 20130408 Christian Marg <marg@rz.tu-clausthal.de> \n
 *                change only the clicked todoitem instead of all items with the same text \n
 * @date 20130408 Leo Eibler <dokuwiki@sprossenwanne.at> \n
 *                migrate changes made by Christian Marg to current version of plugin (use jQuery) \n
 * @date 20130410 by Leo Eibler <dokuwiki@sprossenwanne.at> / http://www.eibler.at \n
 *                bugfix: encoding html code (security risk <todo><script>alert('hi')</script></todo>) - bug reported by Andreas \n
 * @date 20130413 Christian Marg <marg@rz.tu-clausthal.de> \n
 *                bugfix: chk.attr('checked') returns checkbox state from html - use chk.is(':checked') - see http://www.unforastero.de/jquery/checkbox-angehakt.php \n
 * @date 20130413 by Leo Eibler <dokuwiki@sprossenwanne.at> / http://www.eibler.at \n
 *                bugfix: config option Strikethrough \n
 */

/**
 * html-layout:
 *
 * +input[checkbox].todocheckbox
 * +span.todotext
 * -del
 * --span.todoinnertext
 * ---anchor with text or text only
 */

var ToDoPlugin = {
    /**
     * lock to prevent simultanous requests
     */
    locked: false,

    /**
     * @brief onclick method for input element
     *
     * @param {jQuery} $chk the jQuery input element
     */
    todo: function ($chk, checked, indeterminate) {
        //skip when locked
        if (ToDoPlugin.locked) {
            return;
        }
        //set lock
        ToDoPlugin.locked = true;


        var $spanTodoinnertext = $chk.nextAll("span.todotext:first").find("span.todoinnertext"),
            param = $chk.data(); // contains: index, pageid, date, strikethrough
            //checked = !$chk.is(':checked'),
            //indeterminate = $chk.attr('indeterminate');

        // if the data-index attribute is set, this is a call from the page where the todos are defined
        if (param.index === undefined) param.index = -1;

        if ($spanTodoinnertext.length) {

            /**
             * Callback function update the todoitem when save request succeed
             *
             * @param {Array} data returned by ajax request
             */
            var whenCompleted = function (data) {
                //update date after edit and show alert when needed
                if (data.date) {
                    jQuery('input.todocheckbox').data('date', data.date);
                }
                if (data.message) {
                    alert(data.message);
                }
                //apply styling, or undo checking checkbox
                if (data.succeed) {
                    $chk.prop('checked', checked);

                    if (checked) {
                        if (param.strikethrough && !$spanTodoinnertext.parent().is("del")) {
                            $spanTodoinnertext.wrap("<del></del>");
                        }
                    } else {
                        if ($spanTodoinnertext.parent().is("del")) {
                            $spanTodoinnertext.unwrap();
                        }
                    }
                }

                //release lock
                ToDoPlugin.locked = false;
            };

            var ch = 0;

            if(checked)
            {
                var ch = 1;
            }

            if(indeterminate)
            {
                var ch = 2;
            }

			var page = param.pageid;

			//if($chk.closest("div").attr('id').substr(0, 16) == "plugin_include__")
			if($chk.closest("div[id^=\"plugin_include__\"]").length)
			{
				page = $chk.closest("div[id^=\"plugin_include__\"]").attr('id').substr(16).split("__").join(":");
			}
			else
			{
				page = param.pageid;
			}

            jQuery.post(
                DOKU_BASE + 'lib/exe/ajax.php',
                {
                    call: 'plugin_todo',
                    index: param.index,
                    pageid: page,
                    checked: ch,
                    date: param.date
                },
                whenCompleted,
                'json'
            );
        } else {
            alert("Appropriate javascript element not found.\nReverting checkmark.");
        }

    }


};

jQuery(function(){

    jQuery('.tristate').tristate({
        change: function(e) {
            //e.preventDefault();
            //e.stopPropagation();

            var $this = jQuery(this);
            // undo checking the checkbox

            //$this.prop('checked', !$this.is(':checked'));

            ToDoPlugin.todo($this, $this.is(':checked'), $this.is(':indeterminate'));
        }
    });

    // add click handler to todotext spans when marked with 'clickabletodo'
    jQuery('span.todotext.clickabletodo').click(function(){
        //Find the checkbox node we need
		var $chk = jQuery(this).prevAll('input.todocheckbox:first');
        $chk.click();
    });

});
