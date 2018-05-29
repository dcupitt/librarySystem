(function() {

  var libraryStorage = {};

  /*==================librarySystem==================*/
  function librarySystem(libraryName, dependencies, callback) {
    if (arguments.length > 1) {
      // Check that second argument is an Array
      arrayTest(dependencies);
  		// Store library if not created
      storeLibrary(libraryName, dependencies, callback);
  	}
    // Return library if already created
    if (arguments.length === 1) {
      return loadLibrary(libraryName);
    }
  };

  /* ======= Helper Functions ======= */
  // Check that second argument is an Array
  function arrayTest (dependencies) {
    if (Array.isArray(dependencies) === false) {
      throw new Error('Given argument is not an array');
    }
  };

  // Store library as object on the libraryStorage object
  function storeLibrary (libraryName, dependencies, callback) {
    libraryStorage[libraryName] = {
      dependencies: dependencies,
      callback: callback,
    };
  };

  // Runs a series of checks on the library before returning the library with all of it's dependencies
  function loadLibrary(libraryName) {
    var library = libraryStorage[libraryName];
    var dependencies = library.dependencies;

    // Checks if the library object in libraryStorage has a 'cache' property, returns this if true
		if ( 'cache' in library ) {
			return library.cache;
		}

    // Checks if the library's dependenciesAreLoaded. If true, creates a 'cache' property for the library in libraryStorage that returns the library by calling it's callback and parsing in it's array of dependent libraries that in turn call their callbacks and are returned through the loadDependencies function.
    // e.g. library.cache = libraryStorage['workBlurb'].callback.apply(null, dependencies);
		if ( dependenciesAreLoaded(dependencies) ) {
			library.cache = library.callback.apply(null, loadDependencies(dependencies));
			return library.cache;
		}

    // Checks if the library's dependencies exist in libraryStorage, and have been been set to 'return' when called (i.e. are loaded)
		function dependenciesAreLoaded(dependencies) {
			for ( var i = 0 ; i < dependencies.length ; i++ ) {
				var libraryName = dependencies[i];
				if ( !(libraryStorage[libraryName]) ) {
					return false;
				}
			}
			return true;
		}

    // Maps dependencies array of names:
    // e.g. original dependencied array ['name', 'company']
    // to a new array of calls to load the libraries that return each of the libraries:
    // e.g. loadedDependencies array: ['Gordon', 'Watch and Code']
  	function loadDependencies (dependencies) {
      var loadedDependencies = [];
      loadedDependencies = dependencies.map(function (dependencyName) {
        if (libraryStorage.hasOwnProperty(dependencyName)) {
          var dependencies = libraryStorage[dependencyName].dependencies;
					var callback = libraryStorage[dependencyName].callback;
					return loadLibrary(dependencyName, dependencies, callback);
        }
      });
      return loadedDependencies;
    };

  }

  /* ====== Expose the librarySystem function ====== */
  window.librarySystem = librarySystem;

}());

tests({

  'It should accept a library module': function() {
    librarySystem('libOne', [], function() {
      return 'loaded dependency';
    });
    eq(librarySystem('libOne'), 'loaded dependency');
  },

  'It should accept an array of one dependency library.': function() {
    librarySystem('dependency', [], function() {
      return 'loaded dependency';
    });
    librarySystem('dictionary', ['dependency'], function(dependency) {
      return 'full dictionary and a ' + dependency;
    });

    eq(librarySystem('dependency'), 'loaded dependency');
    eq(librarySystem('dictionary'), 'full dictionary and a loaded dependency');
  },

  'It should accept an array of multiple dependency libraries.': function() {

    librarySystem('name', [], function() {
      return 'Gordon';
    });

    librarySystem('company', [], function() {
      return 'Watch and Code';
    });

    librarySystem('workBlurb', ['name', 'company'], function(name, company) {
      return name + ' works at ' + company;
    });

    eq(librarySystem('workBlurb'), 'Gordon works at Watch and Code');
  },

  'It should allow libraries to be created out of order.': function() {
    librarySystem('printName', ['firstName', 'lastName'], function(firstName, lastName) {
      return 'First: ' + firstName + ', ' + 'Last: ' + lastName;
    });
    librarySystem('firstName', [], function() {
      return 'ryan';
    });
    librarySystem('lastName', [], function() {
      return 'lertola';
    });
    eq(librarySystem('printName'), 'First: ryan, Last: lertola');
  },

  'It should run the callback function for each library only once.': function() {
    var numberOfTimesCallbackHasRun = 0;
    librarySystem('favBook', [], function() {
      return 'Tuesdays with Morrie';
    });
    librarySystem('favMovie', [], function() {
      return 'Life is Beautiful, 1997';
    });
    librarySystem('favourites', ['favBook', 'favMovie'], function(favBook, favMovie) {
      numberOfTimesCallbackHasRun++;
      return 'Favourite book: ' + favBook + ' Favourite movie: ' + favMovie;
    });
    librarySystem('favBook');
    librarySystem('favMovie');
    librarySystem('favourites');
    librarySystem('favourites');
    librarySystem('favourites');
    eq(numberOfTimesCallbackHasRun, 1);
  },

  'It should throw an error if something other than an array is parsed in.': function() {
    function testForErrors () {
      var errors = 0;
      try {
        librarySystem('noArray', 1, function() {
          return 'I forgot to put my dependencies as an array.';
        });
      } catch (e) {
        errors++;
      }
      return errors;
    }
    eq(testForErrors(), 1);
  }

});
