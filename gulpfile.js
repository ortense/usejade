var gulp = require('gulp');
var jade = require('jade');
var fs   = require('fs');
var gutil = require('gulp-util');
var markdown = require('gulp-markdown-to-json');
var mkdirp = require('mkdirp');
var _ = require('underscore');

function sanitize(str, only_word_character) {
	str = str.trim(str)
		.toLowerCase()
		.replace(/\s+/g, ' ')
		.replace(/\s+/g, '-')
		.replace(/[áàâãåäæª]/g, 'a')
		.replace(/[éèêëЄ€]/g, 'e')
		.replace(/[íìîï]/g, 'i')
		.replace(/[óòôõöøº]/g, 'o')
		.replace(/[úùûü]/g, 'u')
		.replace(/[ç¢©]/g, 'c');
	if (only_word_character) {
		str = str.replace(/[^a-z0-9\-]/g, '-')
				.replace(/_+/g, '');
	}
	return str;
}

function get_data(){
	var posts = require('./posts.json');
	var tags = {};
	var data = {
		posts : [],
		tags : []
	};

	for (post_name in posts){
	    var post = posts[post_name];
		post.date = new Date(post.date);
		post.date.setDate(post.date.getDate()+1);

		//monta a tag_list com nome e slug
		post.tag_list = [];
		post.tags.forEach(function(tag){
			var slug = sanitize(tag);
			var o = {name:tag, slug:slug};
			post.tag_list.push(o);
		});

		//agrupa posts e tags
		post.tag_list.forEach(function(tag){
			data.tags[tag.slug] = data.tags[tag.slug] || {posts : []};
			data.tags[tag.slug].name = tag.name;
			data.tags[tag.slug].posts.push(post);
		});

		//ordenar por data
		//TODO: isso precisa funcionar
		data.posts.sort(function(a, b) {
			return a.date.getTime() < b.date.getTime();
		});

		data.posts.push(post);
	}

	return data;
}

// fs.writeFileSync('./teste.json', JSON.stringify(get_data()), 'utf-8');

gulp.task('data', function(){
  gulp.src('src/posts/*.md')
    .pipe(gutil.buffer())
    .pipe(markdown('posts.json'))
    .pipe(gulp.dest('.'))
});

gulp.task('index', ['data'], function() {
	var data = get_data();
	var template = jade.compileFile('src/templates/index.jade');
	var result = template(data);
	mkdirp('dest/', function(){
		fs.writeFileSync('dest/index.html', result, 'utf-8');
	});

});

gulp.task('posts', ['data'], function(){
	var data = get_data();
	var template = jade.compileFile('src/templates/post.jade');
	mkdirp('dest/post', function(){
		data.posts.forEach(function(post){
			fs.writeFileSync(
				'dest/post/'+ post.slug +'.html',
				template(post),
				'utf-8'
			);
		});
	});

});

gulp.task('tags', ['data'], function(){
	var data = get_data();
	var template = jade.compileFile('src/templates/tag.jade');
	mkdirp('dest/tag', function(){
		for (index in data.tags) {
			var tag = data.tags[index];

			tag.posts.sort(function(a, b) {
				return a.date.getTime() < b.date.getTime();
			});

			fs.writeFileSync(
				'dest/tag/'+ index + '.html',
				template(tag),
				'utf-8'
			);
		}
	});

});



gulp.task('build', ['index', 'posts', 'tags']);
