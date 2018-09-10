// const axios = require('axios');
import axios from 'axios';
import dompurify from 'dompurify';

function searchResultsHTML(stores) {
	return stores
		.map(store => {
			return `
				<a href="/store/${store.slug}" class="search__result">
					<strong>${store.name}</strong>
					<!-- <p>${store.description}</p> -->
				</a>
			`
		})
		.join('');
}

function typeAhead(search) {
	// console.log(search);
	if(!search) return;

	const searchInput = search.querySelector('input[name="search"]');
	const searchResults = search.querySelector('.search__results');

	// console.log(searchInput, searchResults)
	searchInput.on('input', function() {
		//console.log(this.value)

		// If there is mp vaöie. quit it!
		if(!this.value) {
			searchResults.style.display = 'none';
			return
		}

		// show the search results!
		searchResults.style.display = 'block';
		searchResults.innerHTML = '';

		axios
			.get(`/api/search?q=${this.value}`)
			.then(res => {
				//console.log(res.data);
				if (res.data.length) {
					// console.log('There is something to show!');
					searchResults.innerHTML = dompurify.sanitize(searchResultsHTML(res.data));
					return;
				}
				// Tell them nothing came back
				searchResults.innerHTML = dompurify.sanitize(`<div class="search__result">No results for ${this.value} found</div>`);
			})
			.catch(err => {
				console.log(err);
			});
	});

	searchInput.on('keyup', (e) => {
		console.log(e.keyCode);
		// If they aren't pressing up, down or enter, who cares
		if (![38, 40, 13].includes(e.keyCode)) {
			return;
		}
		console.log('DO SOMETHING!!');
		const activeClass = 'search__result--active';
		const current = search.querySelector(`.${activeClass}`);
		const items = search.querySelectorAll('.search__result');
		let next;
		if (e.keyCode === 40 && current) { // Press down and one selected
			next = current.nextElementSibling || items[0]; // first or next
		} else if (e.keyCode === 40) { // Press down no selected
			next = items[0]; // first
		} else if (e.keyCode === 38 && current) { // Press up and one selected
			next = current.previousElementSibling || items[items.length -1] // last or previous
		} else if (e.keyCode == 38) { // Press up and no selected
			next = items[items.length - 1]; // last
		} else if (e.keyCode === 13 && current.href) { // selection confirm
			window.location = current.href; // Go to selection link
			return;
		}

		console.log(next);
		if (current) {
			current.classList.remove(activeClass);
		}
		next.classList.add(activeClass);
	})
}

export default typeAhead;