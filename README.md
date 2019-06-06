# MathPaste

MathPaste is a simple math-sharing service. Unlike most other math pastebins,
like [mathb.in], it uses [asciimath] instead of LaTeX. We think that asciimath
syntax is much nicer to work with than LaTeX syntax; for example, if you want
to write fraction like this...

![(a+b)/(c+d)](http://latex.codecogs.com/gif.latex?%5Cfrac%7Ba&plus;b%7D%7Bc&plus;d%7D)

...you need `\frac{a+b}{c+d}` in LaTeX, but that's simply `(a+b) / (c+d)` in
asciimath. Awesome!

```
[22:46]              xqb | :)
[22:47]              xqb | I love mathpaste
[22:47]              xqb | :D
[22:47]            Akuli | :)
[22:47]              xqb | not only it eliminated the need to buy another
                           desk
[22:47]              xqb | but it also eliminated the need for notebooks
                           and pens and papers
```


## Using MathPaste

Go to [akuli.github.io/mathpaste](https://akuli.github.io/mathpaste/) and write
some asciimath to the left half of the page. It'll render immediately on the
right side. When you're ready, click the save button in the top right corner,
and you'll get a link to your math. If you send this link to someone, they'll
be able to see the math you wrote.

If you are wondering how you can write something to mathpaste, click the info
button to see a bunch of examples. If you want to attach a drawing to your
math, click the pencil button and draw something.


## More Links

- If you have any trouble with mathpaste, please [open a new issue on GitHub].
- [MathPaste GTK] is a desktop application for using MathPaste. With it, you
  can easily save maths as files on your computer.
- MathPaste renders the asciimath with [MathJax].
- [PurpleMyst] and [Akuli] created MathPaste.
- MathPaste is based on the "interactive renderer" on [asciimath.org][asciimath].
- The area that the math is typed to is implemented with [ace].


## Developing MathPaste

First, fetch the repository.

    $ git clone https://github.com/Akuli/mathpaste
    $ cd mathpaste
    $ npm install

You can now start a development server, with live reloading, by running

    $ npm run start

Then visiting http://localhost:8080/

If you want to distribute this somewhere, you must run

    $ npm run build

Then, `dist/` will contain the "compiled" webapp which you can put on your
server or deploy to gh-pages with `deploy.sh`.

Types are not checked by `npm run build` or `npm run start`. You can check
types either by utilizing a language server in your editor, which is out of
the scope of this README, or by running

    $ npm run check-types

[mathb.in]: http://mathb.in/
[asciimath]: http://asciimath.org/

[open a new issue on GitHub]: https://github.com/Akuli/mathpaste/issues/new
[MathPaste GTK]: https://github.com/Akuli/mathpaste-gtk
[MathJax]: https://mathjax.org/
[PurpleMyst]: https://github.com/PurpleMyst/
[Akuli]: https://github.com/Akuli/
[ace]: https://ace.c9.io/
