var lunrIndex, pagesIndex;

function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
}

// Initialize lunrjs using our generated index file
function initLunr() {
    if (!endsWith(baseurl,"/")){
        baseurl = baseurl+'/'
    };

    // First retrieve the index file
    $.getJSON(baseurl +"index.json")
        .done(function(index) {
            pagesIndex = index;
            // Set up lunrjs by declaring the fields we use
            // Also provide their boost level for the ranking
            lunrIndex = lunr(function() {
                this.ref("uri");
                this.field('title', {
		    boost: 15
                });
                this.field('tags', {
		    boost: 10
                });
                this.field('description', {
		    boost: 15
                });
                this.field("content", {
		    boost: 5
                });
				
                this.pipeline.remove(lunr.stemmer);
                this.searchPipeline.remove(lunr.stemmer);
				
                // Feed lunr with each file and let lunr actually index them
                pagesIndex.forEach(function(page) {
		    this.add(page);
                }, this);
            })
        })
        .fail(function(jqxhr, textStatus, error) {
            var err = textStatus + ", " + error;
            console.error("Error getting Hugo index file:", err);
        });
}

/**
 * Trigger a search in lunr and transform the result
 *
 * @param  {String} query
 * @return {Array}  results
 */
function search(queryTerm) {
    // Find the item in our index corresponding to the lunr one to have more info
    return lunrIndex.search(queryTerm+"^100"+" "+queryTerm+"*^10"+" "+"*"+queryTerm+"^10"+" "+queryTerm+"~2^1").map(function(result) {
            return pagesIndex.filter(function(page) {
                return page.uri === result.ref;
            })[0];
        });
}

// Let's get started
initLunr();
$( document ).ready(function() {
    var searchList = new autoComplete({
        /* selector for the search box element */
        selector: $("#search-by").get(0),
        /* source is the callback to perform the search */
        source: function(term, response) {
            response(search(term));
        },
        /* renderItem displays individual search results */
        renderItem: function(item, term) {
            var reg = new RegExp(term, "i")
            var res = reg.exec(item.description+item.content);
            var numContextWords = 2;
            var text = item.description.match(
                "(?:\\s?(?:[\\w]+)\\s?){0,"+numContextWords+"}" +
                    res+"(?:\\s?(?:[\\S]+)\\s?){0,"+numContextWords+"}");
            if ( text == null){
              text = item.content.match(
                "(?:\\s?(?:[\\w]+)\\s?){0,"+numContextWords+"}" +
                    res+"(?:\\s?(?:[\\S]+)\\s?){0,"+numContextWords+"}");
            }
            item.context = text;
            
            return '<div class="autocomplete-suggestion" ' +
                'data-term="' + term + '" ' +
                'data-title="' + item.title + '" ' +
                'data-uri="'+ item.uri + '" ' +
                'data-context="' + item.context + '">' +
                item.title +
                '<div class="context">' +
                (item.context || '') +'</div>' +
                '</div>';
        },
        /* onSelect callback fires when a search suggestion is chosen */
        onSelect: function(e, term, item) {
            location.href = item.getAttribute('data-uri');
        }
    });
});

function citationPopup(id) {
  var popup = document.getElementById("myPopup_"+id);
  // popup.classList.toggle("show");
  popup.style.display = "block";
}

function citationPopupClose(id) {
  var popup = document.getElementById("myPopup_"+id);
  // popup.classList.toggle("show");
  popup.style.display = "none";
}

function copytext(id) {
  var copyText = document.getElementById("cite_"+id);
  var text = copyText.innerText;
  copyText.value = text

  //create a selection range
  var CopyRange = document.createRange();
  //choose the element we want to select the text of
  CopyRange.selectNode(copyText);
  //select the text inside the range
  window.getSelection().addRange(CopyRange);
  document.execCommand("copy");     //remove our selection range
  alert("Citation Copied!");
}
