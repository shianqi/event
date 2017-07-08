## jQuery-原理与机制

1. gelElementById太长了
页面上有个按钮，还有个图片，我想点击按钮图片隐藏，如下HTML：

```html
<button id="button">点击我</button>
<img id="image" src="xxx.jpg">
```

于是，我的脚本可能就这样：

```javascript
var button = document.getElementById("button")
    , image = document.getElementById("image")

button.onclick = function() {
    image.style.display = "none";
};
```
有何问题？人几乎都是天生的“懒惰者”，`document.getElementById` 名称长且重复出现，好像到了公司发现卡没带又回家重新拿卡的感觉，我希望越简单越好。恩， 我很喜欢钱，$这个符号我很喜欢，我打算改造一番，简化我的工作：
```javascript
var $ = function(id) {
    return document.getElementById(id);
};

$("button").onclick = function() {
    $("image").style.display = "none";
};
```
这里的 `$()` 就是最简单的包装器，只是返回的是原生的DOM对象。

2. 我需要一个简洁的暗号，就像“芝麻开门”
后来页面复杂了，点击一个按钮，有2张图片要隐藏。
```javascript
$("button").onclick = function() {
    $("image1").style.display = "none";
    $("image2").style.display = "none";
};
```
好像又看见长长的重复的东西，xxx.style.display = "none", 为什么每次开门都要从包里找到钥匙、对准插口插进去、还要左扭扭右扭扭呢？一次还好，天天经常老是这样怎受得了。设想，要是有个芝麻开门的暗号就好了，“open开”，声音识别，门自动开了，多省心。

这里每次隐藏都要xxx.style.display = "none", 比每天拿钥匙开门还要烦，我希望有一个快捷的方式，例如，“hide隐”，语句识别，元素自动隐藏，多省心。

就是要变成下面的效果：
```javascript
$("button").onclick = function() {
    $("image1").hide();
    $("image2").hide();
};
```
3. 如何识别“芝麻开门”的暗号
$("image1")本质是个DOM元素，$("image1").hide()也就是在DOM元素上扩展一个hide方法，调用即隐藏。

哦，扩展，立马想到了JS中的prototype原型。//zxx: 老板，现在满大街什么菜最便宜。老板：原型啊，都泛滥了！

```javascript
HTMLElement.prototype.hide = function() {
    this.style.display = "none";
};
```

虽然在身体上钻了个窟窿插进入了一个方法，毕竟浏览器有有效果啊，切肤之痛就不算什么了。但是，我们是在泱泱天朝，很多IE6~IE8老顽固，这些老东西不认识HTMLElement，对于HTMLElement自残扩展之法根本理解不了，而这些老家伙掌管了半壁江山。唉，面对现实，元素直接扩展是行不通了。

因此，由于兼容性，我们需要想其他扩展方法。

4. 条条大路通罗马，此处不留爷，自有留爷处
虽IE6~IE8不识HTMLElement原型扩展，但是，Function的原型扩展其认识啊。管不管用，暂时不得而知，先随便搞个简单的试试呗~

```javascript
var F = function() {};
F.prototype.hide = function() {
    this.style.display = "none";
};
new F().hide();
```

上面的代码，new F()您可以看做是this?.style这里的this. 您可能会跳起来抢答道：“那new F()的return值 = DOM元素不就完事OK啦！—— this.style.hide = new F().style.hide = DOM.style.hide”！

很傻很天真

只要new表达式之后的constructor返回（return）一个引用对象（数组，对象，函数等），都将覆盖new创建的匿名对象，如果返回（return）一个原始类型（无return时其实为return原始类型undefined），那么就返回new创建的匿名对象。

上面的引用来自这里。什么意思呢？说白了就是，new F()如果没有返回值(Undefined类型)，或返回值是5种基本型（Undefined类型、Null类型、Boolean类型、Number类型、String类型）之一，则new F()我们可以看成是原型扩展方法中的this; 如果返回是是数组啊、对象啊什么的，则返回值就是这些对象本身，此时new F() ≠ this。

举例说明：
```javascript
var F = function(id) {
    return document.getElementById(id);
};

new F("image1") == document.getElementById("image1");    // true 说明看上去返回DOM对象，实际确实就是DOM对象
var F = function(id) {
    return id;
};
```
new F("image1") == "image1";    // false 说明看上去返回字符串值，实际并不是字符串
回到上面天真的想法。要想使用prototype.hide方法中的this, 偶们就不能让F函数有乱七八糟的返回值。

因此，new F()直接返回DOM是不可取的，但我们可以借助this间接调用。比方说：
```javascript
var F = function(id) {
    this.element = document.getElementById(id);
};
F.prototype.hide = function() {
    this.element.style.display = "none";
};

new F("image").hide();    // 看你还不隐藏
```

5. 暴露与重用元素获取方法
上面的方法，元素的获取直接在F方法中，但是，实际情况，考虑到兼容性实现，元素获取可能会相当复杂，同时方法私有，不能重利用。因此，可以把元素获取方法放在原型上，便于管理和重用。代码如下：
```javascript
var F = function(id) {
    return this.getElementById(id);
};
F.prototype.getElementById = function(id) {
    this.element = document.getElementById(id);
    return this;
};
F.prototype.hide = function() {
    this.element.style.display = "none";
};

new F("image").hide();    // 看你还不隐藏
```
元素获取方法放在prototype上，通过F()执行。你可能会奇怪了，你刚明明说“new F()直接返回DOM是不可取的”，怎么现在又有return呢？大家务必擦亮眼睛，F.prototype.getElementById的返回值是this，也就是new F()的返回值是this. 形象点就是new F("image")出了一拳，又反弹到自己脸上了。


6. 我不喜欢new, 我喜欢$
new F("image")这种写法我好不喜欢，我喜欢$, 我就是喜欢$, 我要换掉。

好吧，把new什么什么藏在$方法中把~
```javascript
var $ = function(id) {
    return new F(id);
};
```
于是，上面的图片隐藏的直接执行代码就是：
```javascript
$("image").hide();
```

IE6浏览器也是支持的哦！是不是已经有些jQuery的样子啦！

7. 你怎么就一种姿势啊，人家都腻了诶
循序渐进到现在，都是拿id来举例的，实际应用，我们可能要使用类名啊，标签名啊什么的，现在，为了接下来的继续，有必要支持多个“姿势”。

在IE8+浏览器中，我们有选择器API，document.querySelector与document.querySelectorAll，前者返回唯一Node，后者为NodeList集合。大统一起见，我们使用后者。于是，就有：

```javascript
var F = function(selector, context) {
    return this.getNodeList(selector, context);
};
F.prototype.getNodeList = function(selector, context) {
    context = context || document;
    this.element = context.querySelectorAll(selector);
    return this;
};

var $ = function(selector, context) {
    return new F(selector, context);
};
```
此时，我们就可以使用各种选择器了，例如，$("body #image"), this.element就是选择的元素们。

8. IE6/IE7肿么办？
IE6/IE7不认识querySelectorAll，咋办？
怎么办？

jQuery就使用了一个比较强大的选择器框架-Sizzle. 知道就好，重在演示原理，因此，下面还是使用原生的选择器API示意，故demo效果需要IE8+浏览器下查看。

8. 遍历是个麻烦事
this.element此时类型是NodeList, 因此，直接this.element.style.xxx的做法一定是报错，看来有必要循环下：
```javascript
F.prototype.hide = function() {
    var i=0, length = this.element.length;
    for (; i<length; i+=1) {
        this.element[i].style.display = "none";
    }    
};
```
于是乎：
```javascript
$("img").hide();  // 页面所有图片都隐藏啦！
```

单纯一个hide方法还可以应付，再来个show方法，岂不是还要循环遍历一次，岂不是要烦死~

因此，急需一个遍历包装器元素的方法，姑且叫做each吧~

于是有：
```javascript
F.prototype.each = function(fn) {
    var i=0, length = this.element.length;
    for (; i<length; i+=1) {
        fn.call(this.element[i], i, this.element[i]);
    }
    return this;
};
F.prototype.hide = function() {
    this.each(function() {
       this.style.display = "none";
    });
};

$("img").hide();  // 页面所有图片都隐藏啦！
```

9. 我不喜欢this.element, 可以去掉吗？
现在包装器对象结构类似这样：
```javascript
F.prototype = {
    element: [NodeList],
    each: function() {},
    hide: function() {}
}
```
element看上去好碍眼，就不能去掉吗？可以啊，宝贝，NodeList是个类数组结构，我们把它以数值索引形式分配到对象中就好啦！一来去除冗余element属性，二来让原型对象成为类数组结构，可以有一些特殊的功能。

于是，F.prototype.getNodeList需要换一个名字了，比方说初始化init, 于是有：
```javascript
F.prototype.init = function(selector, context) {
    var nodeList = (context || document).querySelectorAll(selector);
    this.length = nodeList.length;
    for (var i=0; i<this.length; i+=1) {
        this[i] = nodeList[i];    
    }
    return this;
};
```
此时，each方法中，就没有烦人碍眼的this.element[i]出现了，而是直接的this[i].
```javascript
F.prototype.each = function(fn) {
    var i=0, length = this.length;
    for (; i<length; i+=1) {
        fn.call(this[i], i, this[i]);
    }
    return this;
};
```
我们也可以直接使用索引访问包装器中的DOM元素。例如：$("img")[0]就是第一张图片啦！

上面代码的demo地址应该不会被人看到吧……

10. 我是完美主义者，我特不喜欢F名称，可以换掉吗？
F这个名称从头到尾出现，我好不喜欢的来，我要换成$, 我就是要换成$符号……


就有：
所有的F换成$.fn之后~

上图代码的demo地址应该不会被人看到吧……

显然，运行是OK的。似乎也非常有jQuery的模样了，但是，实际上，跟jQuery比还是有差别的，有个较大的差别。如果是上图代码所示的JS结构，则包装器对象要扩展新方法，每个都需要再写一个原型的。例如，扩展一个attr方法，则要写成：
```javascript
$.fn.prototype.attr = function() {
    // ...
};
```
又看到prototype了，高级的东西应该要隐藏住，否则会给人难以上手的感觉。那该怎么办呢？御姐不是好惹的。

脑子动一下就知道了，把F.prototype换成$.fn不久好了。这样，扩展新方法的时候，直接就是
```javascript
$.fn.attr = function() {
    // ...
};
```
至此，就使用上讲，与jQuery非常接近了。 但是，还有几个F怎么办呢，总不能就像下面这样放着吧：
```javascript
var $ = function(selector, context) {
    return new F(selector, context);
};
var F = function(selector, context) {
    return this.init(selector, context);
};

$.fn = F.prototype;

$.fn.init = function(selector, context) {
    // ...
    return this;
};
$.fn.each = function(fn) {
   // ...
};
$.fn.hide = function() {
   // ...
};
```
数学中，我们都学过合并同类项。仔细观察上面的的代码：
$()返回的是new F()，而new F()又是返回的对象的引用。擦，这返回来返回去的，参数又是一样的，我们是不是可以一次性返回，然后再做些手脚，让$.fn.init返回的this依然能够正确指向。

于是，一番调整有：
```javascript
var $ = function(selector, context) {
    return new $.fn.init(selector, context);
};
var F = function() { };

$.fn = F.prototype;
$.fn.init = function(selector, context) {
    // ...
    return this;
};
// ...
```

上面代码显然是有问题的，new的是$.fn.init, $.fn.init的返回值是this. 也就是$()的返回值是$.fn.init的原型对象，尼玛$.fn.init的prototype原型现在就是个光杆司令啊，哟，正好，$.fn对应的原型方法，除了init没用外，其他hide(), each()就是我们需要的。因此，我们需要加上这么一行：
```javascript
$.fn.init.prototype = $.fn
```
于是，$()的返回值从$.fn.init.prototype一下子变成$.fn，正好就是我们一开始的扩展方法。

于是乎，大功告成。慢着……
慢着……

上面明明还有残留的F呢！

 哦，那个啊。F是任意函数，$本身就是函数，因此，直接使用$替换就可以了：
```javascript
var $ = function(selector, context) {
    return new $.fn.init(selector, context);
};
var F = function() { };   // 这个直接删除
$.fn = $.prototype;
$.fn.init = function(selector, context) {
    // ...
    return this;
};

// ...
```

实际上，如果你不是非得一个$行便天下的话，到了上面进阶第9步就足够了。jQuery在第10步的处理是为了彰显其$用得如此的出神入化，代码完美，令人惊叹！

至此，jQuery大核心已经一步一步走完了，可以看到，所有的这些进阶都是根据需求、实际开发需要来的，慢慢完善，慢慢扩充的！

11. 每个扩展方法都要$.fn.xxxx, 好闹心的来
```javascript
$.fn.css = function() {}
$.fn.attr = function() {}
$.fn.data = function() {}
// ...
```
每个扩展前面都有个$.fn, 好讨厌的感觉，就不能合并吗？

于是，jQuery搞了个extend方法。
```javascript
$.fn.extend({
    css: function() {},
    attr: function() {},
    data: function() {},
    // ...
});
```
12. $()不仅可以是选择器字符串，还可以是DOM
在init方法中，判断第一个参数，如果是节点，直接this[0] = this_node. over!
