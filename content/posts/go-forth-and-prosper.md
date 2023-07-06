---
title: "Go Forth and Prosper"
date: 2023-07-06T14:11:01+01:00
draft: true
tags: tutorial, forth, go, compilers, languages
---

## TL;DR
* Split input on white space
* Numbers get added to a stack, words get executed
* Pre-define some words in the interpreter
* Write new words in Forth


## Background

For last year's [Advent of Code](https://adventofcode.com/2022), in one of those should-really-stop-overestimating-my-skills type of situations, I took on the challenge of using a different programming language every day. Needless to say, a day quickly took on a looser definition as the problems got progressively harder and the languages more esoteric. But I had tons of fun, and learned a lot.

A few languages stood out to me, and I made a promise to myself that I'do something more with them. Unfortunately, it's hard to convince my employer of the merits of [glyph based code](https://github.com/jotinha/advent-of-code-2022/blob/main/23/main.apl) or that our industry really made a mistake moving away from [assembly](https://github.com/jotinha/advent-of-code-2022/blob/main/17/main.wat) in the first place, so I had to commit to some sort of personal project if I wanted to keep that promise.

This is where **Forth** comes in. A very simple, yet remarkably powerful, language that is easy to build a compiler for. So much so, that doing it has become a rite of passage for anyone interested in learning about compilers or programming languages in general. And that's what we're going to try to do here! 

To be clear, our goal is not a fully featured, standards compliant, Forth. I'll be happy if we have enough of it to run [this code](https://github.com/jotinha/advent-of-code-2022/blob/main/20/main.fth). But that's not going to be on the first try either. No, I'll milk this journey into a series of blog posts.

If you want to a see an actual complete and very thoroughly documented implementation of Forth, look no further than [JONESFORTH](http://git.annexia.org/?p=jonesforth.git;a=blob;f=jonesforth.S;h=45e6e854a5d2a4c3f26af264dfce56379d401425;hb=HEAD). If you didn't consider yourself a geek before, be warned that the ASCII art diagrams alone will turn you into one in no time. 

## Learn Forth

Don't know Forth? Don't worry, follow this [5 mins tutorial](https://learnxinyminutes.com/docs/forth/) and try it out [online](https://www.tutorialspoint.com/execute_forth_online.php). Another great resource is [Easy Forth](https://skilldrick.github.io/easyforth/#introduction), which comes with an online REPL as well. If you want to go even deeper on the language, [Simple Forth](http://www.murphywong.net/hello/simple.htm) is a classic.

The main thing you notice when you first see Forth code is that it uses [Reverse Polish Notation](https://en.wikipedia.org/wiki/Reverse_Polish_notation). Where in other languages you would write `foo(bar(1 + 2 * 3))`, in Forth you might instead write `1 2 3 * + foo bar`. You'd be forgiven to think that's a crazy way to go about things, and that you have better uses of your time than listening to this nonsense, but this notation has a few advantages:

* it's trivial to parse, just split on whitespace
* you don't need to care about operator precedence
* it's a fun, different, way to think [^1]

[^1]: And really, we should challenge our brains more and our CPUs less.

There is much more to the language than its syntax of course, but we'll talk about the important bits as we go along building our very own Forth.

## The Interpreter

For this little experiment, we'll be implementing the Forth interpreter / compiler in [Go](https://learnxinyminutes.com/docs/go/), for no other reason than I like how the title of this post gets to look like as a result. Because you know what they say, it's not worth doing if you're not having pun.

We'll start by building the basic interpreter loop. We will read the input code from stdin and split it into tokens separated by whitespace(s). We can do that quite neatly using `bufio` and the `ScanWords` split function. `ToLower` then forces our Forth to be case-insensitive, because shouting out commands at a computer is something crazy people do.

```go 
// goforth1.go
package main

import (
	"bufio"
	"fmt"
	"strings"
)

func main() {
    scanner := bufio.NewScanner(os.Stdin)
    scanner.Split(bufio.ScanWords)

    for scanner.Scan() {
        exec(strings.ToLower(scanner.Text()))
    }
}

func exec(instr string) {
    fmt.Printf("Parsing '%s'.\n", instr)
}
```

Now we can start our Forth interpreter and see that it properly parses our input:

```bash
$ go build -o goforth goforth1.go
$ echo "1 2 + \n 2  -" | ./goforth
Parsing '1'.
Parsing '2'.
Parsing '+'.
Parsing '2'.
Parsing '-'.
```

Congratulations are in order, we just built a full-blown language parser! Maybe it's not much of an achievement considering Forth is just about the easiest programming language to parse, but we take our wins where we can.

Our interpreter is now ready to start doing something actually useful.

## A Stack of Numbers

In Forth, a code instruction can either be a number (the data) or a word (a subroutine).[^2] If it's a number, the interpret will immediately push it to a global stack, the parameter stack.

[^2]: Some might say a number is also a word, but then I might say please ignore these people who want to ruin the blog post I had half written when I realized they were right.

The **stack** is the main data structure we will be manipulating as we execute the code, pushing and pulling data from it. It looks something like this (you may be rightfully wincing at the usage of global variables and functions, but it will help with readability later on)


```go
var STACK = []int{}

// push one or more numbers to the stack
func push(x ...int) { 
    STACK = append(STACK, x...)
}

// remove and return the number at the top of the stack
func pop() (int) {
    last := peek()
    STACK = STACK[:len(STACK) - 1]
    return last
}

// return the number at the top of the stack without poping it
func peek() int {
    return STACK[len(STACK)-1]
}
```

Distinguishing between numbers and words is trivially done by trying to parse a number and checking for failure. 

```go
func exec(instr string) {
    fmt.Printf("Parsing '%s'. ", instr)

    if number, err := strconv.Atoi(instr); err == nil {
        // it's a number, push to stack
        push(number)
        fmt.Println("Stack now looks like this:", STACK)
    } else {
        // it's a word, do something else
        fmt.Println("I don't know any words yet")
    }
}
```

The eagle-eyed[^3] among you will notice we only have support for integers right now. Forth usually treats floating point numbers separately, with its own stack and words. That seems like it would be boring to implement, so I'll just leave that as an exercise to the reader.[^4]

[^3]: Or gopher-eyed.

[^4]: Only people who care about money, science, engineering, and everything else really, need useless features like these anyway. You can't divide _people_ into fractions, man.
 
Now we can run our little interpreter and see the stack grow and grow as we feed it numbers. In the next section we will implement the addition and subtraction operators that will consume from the stack and do something useful with it.

```bash
$ echo "1 2 + \n 2  -" | ./goforth
Parsing '1'. Stack now looks like this: [1]
Parsing '2'. Stack now looks like this: [1 2]
Parsing '+'. I don't know any words yet
Parsing '2'. Stack now looks like this: [1 2 2]
Parsing '-'. I don't know any words yet
```

## A Dictionary of Words

If a token, any sequence of non-whitespace characters, is not a number, it must be a word. A word is just the name for a subroutine, a piece of code that when executed manipulates the stack to do something useful. Let's take a look at an example.

We'll start by implementing `+`, the addition operator. Calling this word will pop the two numbers at the top of the stack and add them together, pushing the result back into the stack. A simple implementation would look like this

```go
func add()  { 
    a := pop()
    b := pop()
    result := a + b
    push(result) 
}
```
or in condensed form

```go
func add()  { push(pop() + pop()) }
```

Similarly for subtraction, `-` <a name="sub"></a>

```go
func sub()  { push(pop() - pop()) }
```

Now we will store these Go functions into a global dictionary that maps a word to their executable code.

```go
var WORDDEF map[string]func()

func initWords() {
    WORDDEF = map[string]func(){
        "+": add, 
        "-": sub,
    }
}
```

We just need to make sure to initialize our dictionary at the start of our program.

```go
func main() {
    initWords()
    ...
}    
```

From now on, when our interpreter encounters a word as it's parsing the Forth code stream, it will look for it in this dictionary. If it finds an entry, it executes the associated code straight away. If it doesn't, it will, against the timeless advice of legendary sci-fi comedy author of the late Douglas Adams, panic.

```go
func exec(instr string) {
    fmt.Printf("Parsing '%s'. ", instr)

    if number, err := strconv.Atoi(instr); err == nil {
        // it's a number, push to stack
        push(number)
    } else if word, ok := WORDDEF[instr]; ok {
        // it's a word that we know, execute it
        word()
    } else {
        // we don't know this word, error
        panic(fmt.Sprintf("Word '%s' doesn't exist", instr))
    }
    fmt.Println("Stack now looks like this:", STACK)

}
```

Now to test it

```bash
$ echo "1 2 + \n 2  -" | ./goforth
Parsing '1'. Stack now looks like this: [1]
Parsing '2'. Stack now looks like this: [1 2]
Parsing '+'. Stack now looks like this: [3]
Parsing '2'. Stack now looks like this: [3 2]
Parsing '-'. Stack now looks like this: [-1]
```

Great, as expected, the `+` word removes 1 and 2 from the stack, and puts 3 there instead. But, uh-oh, something's wrong with that subtraction operation. If we remember the wikipedia article from 5 minutes ago we know that `1 2 + 2 -` is Reverse Polish for `(1 + 2) - 2`, which, if we remember our first grade math, should resolve to `1`. Instead we get `-1`.

This is a silly bug we introduced in our Go implementation, the result of trying to optimize for the code looking symmetric and neat over it being correct. Remember our definition of `sub()` from [above](#sub), where we do `pop() - pop()`? Well, if we have a stack that looks like `[a b]` (i.e. `a` is at the bottom of the stack, `b` at the top), this operation first pops `b` and then pops and subtracts `a`, computing `b - a` in standard math notation. We actually want `a - b`.

Following a long lasting tradition of software development in the real world, we're just going to ignore this bug and move on to something else.

## Some More Words

If you want to do anything useful in Forth you'll have to do some stack manipulation, and only a handful of simple definitions built into your interpreter is enough to get started. More advanced functionality can just be built with Forth itself!

```go
func drop()  { pop() }                                  // ( a -- )
func dup()   { push(peek()) }                           // ( a -- a a )
func swap()  { push(pop(), pop()) }                     // ( a b -- b a )
func rot()   { swap(); push(pop(), pop(), pop()) }      // ( a b c -- b c a)
func clear() { STACK = nil }                            // ( a b c -- )
```

The comments on the right are just the standard way to annotate words in Forth (although, of course, we're not actually _in_ Forth yet, but I thought the sooner we get acquainted the better). These comments are meant to represent the state of the stack before and after the word is executed. For example, `swap` is a word that will swap the positions of the two top elements of the stack, thus if the stack looked like `[a b]`, after `swap` is applied, it will look like `[b a]`.

And speaking of `swap`, let's use it to fix the bug from before!

```go
func subFixed()  { swap(); sub() }                      // ( a b -- a - b)
```

You'd probably shutdown my bug fixing PR, signing off with the disappointed emoji and mournful words about the quality of devs these days. In my defense, it was done this way because the narrative _demanded it_. I wanted to illustrate how Forth programmers tend to think, building words on top of other words, manipulating the stack rather than storing things in variables. 

Moving on with a few more useful words

```go
// pop and print the top of the stack
func dot() { fmt.Println(pop()) }

// print the whole stack without changing it
func dots() { fmt.Println(STACK) }

// exit Forth
func bye() { os.Exit(0) }

// print out all currently defined words
func words() {
    for word, _ := range WORDDEF {
        fmt.Println(word)
    }
}
```

For completeness, let's add the rest of the arithmetic functions

```go
func mult() { push(pop() * pop()) }                     // ( a b -- a * b)
func div()  { swap(); push(pop() / pop()) }             // ( a b -- a / b)
func mod()  { swap(); push(pop() % pop()) }             // ( a b -- a mod b)
```

...a few logical operators[^5] 

[^5]: `push` expects an int, so we had to define a new `pushb` which works with boolean arguments.

```go
func not() { pushb(pop() == 0)}                         // ( a -- a == 0)
func equal() { pushb(pop() == pop())}                   // ( a b -- a == b)
func land() { pushb((pop() != 0) && (pop() != 0)) }     // ( a b -- a && b)
func lor() { pushb((pop() != 0) || (pop() != 0)) }      // ( a b -- a || b)
func lt()  { swap(); push(pop() < pop()) }              // ( a b -- a < b)
```

...and let's not forget our bitwise friends

```go
func and() { push(pop() & pop())}                       // (a b -- a & b)
func or() { push(pop() | pop())}                        // (a b -- a | b)
func xor() { push(pop() ^ pop())}                       // (a b -- a ^ b)
```

Then we make sure to register them all so they are accessible from Forth

```go
func initWords() {
    WORDDEF = map[string]func(){
        "drop": drop, "dup": dup, "swap": swap, "rot": rot, "clear": clear,
        "+": add, "-": subFixed, "*": mult, "/": div, "mod": mod,
        "not": not, "=": equal, "land": land, "lor": lor, "<": lt,
        "and": and, "or": or, "xor": xor,
        ".": dot, ".s": dots, "bye": bye, "words": words,
    }
}
```

That was a lot of copy and pasting going around. Let's try it out finally

```bash
$ echo "1 2 + 2 - . " | ./goforth
1
$ echo "1 2 3 rot .s " | ./goforth
[2 3 1]
$ echo "6 6 6 * swap / . " | ./goforth
6
```

We're practically done! This is about as many words as you need to pre-define using the native language of your interpreter,[^6] which in our case is Go. The rest of the words that make a standard Forth implementation can be implemented in Forth itself. This is called bootstrapping Forth, and it's a thing of beauty!

[^6]: There probably exists a smaller theoretical set of instructions you could bootstrap from, but that's more of an academic question, this is a good practical set. There are still a few important ones missing, but we'll leave that for another time.

But wait, how do we define words from within Forth? We need just a couple more words, then we're done, I promise. Well, for now.

## In Your Own Words

In Forth, you create a new word by using a sequence in the format `: NAME <code> ;`. For example, this creates a word that increments the number at the top of the stack by 1:

```Forth
: inc 1 + ;
```

And we can use it like so

```Forth
10 inc . 
```

This prints out 11.

But how does the interpreter actually know that when it sees something between `:` and `;` it's supposed to compile it into a new word? Remember before when we discussed how the interpreter parses a token and immediately does something with it, either adding a number to the stack or executing a word? This is true when the system is in the **interpret** mode (sometimes called **immediate** mode). But there is an alternate **compile** mode, where the parsed tokens, rather than being executed, get added to the body of a word currently being compiled.

Let's first define a global variable to control in which of the states our interpreter is

```go
var STATE = 0  // 0 - interpret mode, 1 - compile mode
```

We'll also need a temporary container, the compile body, which will hold the tokens that we see when we're in compile mode (everything between `:` and `;`).

```go
var CBODY = []string{}
```

Let's go ahead and incorporate these new concepts into our main loop

```go
func exec(instr string) {

    if STATE == 1 && instr != ";" {
        // compile mode, add to compile body
        CBODY = append(CBODY, instr)
    } else if number, err := strconv.Atoi(instr); err == nil {
        // it's a number, push to stack
        push(number)
    } else if word, ok := WORDDEF[instr]; ok {
        // it's a word that we know, execute it
        word()
    } else {
        // we don't know this word, error
        panic(fmt.Sprintf("Word '%s' doesn't exist", instr))
    }

}
```

Now we just need to implement `:`, which simply puts the interpreter into compile mode,

```go
func startCompile() { 
    STATE = 1 
}
```

and then `;`, which ends the compilation, takes the compile body, and creates a new entry in our dictionary

```go
func endCompile() { 
    wordname := CBODY[0] // first token in CBDOY is the word
    instructions := append([]string{}, CBODY[1:]...) // copy CBODY[1:] into new slice
    CBODY = nil // reset the compile body
  
    // build the new function that, when executed, will execute `instructions`
    WORDDEF[wordname] = func() { 
        for _, instr := range instructions {
            exec(instr)
        }
    }

    STATE = 0 // go back to interpret mode
}
```

Don't forget, as always, to add `:` and `;` to the word dictionary

```go
func initWords() {
    WORDDEF = map[string]func(){
        ...
        ":": startCompile, ";": endCompile,
    }
} 
```

Notice that in our latest version of `exec` we had to make a special case for when we're in compile mode (`STATE=1`) and see the word `;`. This is because words don't get executed in compile mode, you'll remember, so we'd never get to actually run the code inside `end_compile()` that flips back `STATE`, and we'd just continue merrily compiling until we run out of input.

If you thought this special condition `instr != ";"` has the tiniest of hints of code smell, then you should be proud of your metaphorical digital nose. It's a poor way to implement this behavior. Instead, Forth defines the more general concept of an **immediate** word, which is a word that, regardless of the current state, gets executed immediately when parsed. We'll see in future blog posts how immediate words are useful to implement all kinds of neat things in Forth.

And to test it out

```bash
$ echo ": inc 1 + ; 10 inc . " | ./goforth
11
```

Success!

## Last Words

That's all for now, we got a decently working Forth implementation going. We have a parser, some predefined words, a working compiler for new words. All in less than 150 lines of Go! I bet you could do some useful work with it already.

[Here's the whole code](https://gist.github.com/jotinha/3d84b738d52a2e9ef6e4fdcde0e2149a) used in this tutorial.

In the next episode of this series we'll talk about branching and how we can implement IF statements and FOR loops using pure Forth. That's right, where other languages do all the legwork of providing native control structures, wrapped up with a nice little bow of syntactic sugar, right from the comfortable pedestal of high levelness from which laziness spawns, in Forth, you roll your own. And then you prosper.
