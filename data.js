/* Transcribed and checked against all four pages of VOCABULAIRE MILITAIRE.pdf.
   Slash alternatives are expanded; accepted equivalents use ~. No PDF upload is required. */
(function (root) {
  'use strict';
  const sections = [
    ['uniform', 'Форма и экипировка', 'La tenue militaire', 1],
    ['appearance', 'Внешний вид', 'L’apparence', 1],
    ['ranks', 'Знаки различия и звания', 'Les insignes et les grades', 1],
    ['qualities', 'Моральные качества', 'Les caractéristiques morales', 2],
    ['duties', 'Обязанности солдата', 'Les devoirs du soldat', 2],
    ['daily', 'Повседневная служба', 'La vie militaire', 3],
    ['safety', 'Снаряжение и безопасность', 'Le matériel et la sécurité', 3],
    ['missions', 'Миссии и население', 'Les missions', 3],
    ['imperative', 'Утвердительные команды', 'L’impératif affirmatif', 4],
    ['negative', 'Отрицательные команды', 'L’impératif négatif', 4],
    ['connectors', 'Полезные связки', 'Les connecteurs utiles', 4]
  ].map(([id, ru, fr, page]) => ({id, ru, fr, page}));
  const rows = {
    uniform: `une tenue militaire|военная форма
porter|носить
mettre|надевать
la tenue de campagne|полевая форма
la tenue de service|повседневная форма~служебная форма
la grande tenue|парадная форма
une coiffure|головной убор
un casque|каска~шлем
un béret|берет
une casquette|фуражка
un manteau|пальто~шинель
une vareuse|китель
des chaussures militaires|военная обувь
préparer son équipement|готовить своё снаряжение~готовить свое снаряжение~подготовить своё снаряжение
vérifier son équipement|проверять своё снаряжение~проверять снаряжение
la tenue comprend~la tenue comporte|форма включает в себя
porter une tenue militaire|носить военную форму
porter la tenue de campagne|носить полевую форму
porter la tenue de service|носить повседневную форму~носить служебную форму
porter la grande tenue|носить парадную форму
mettre une tenue militaire|надевать военную форму
mettre une coiffure|надевать головной убор
mettre un manteau|надевать пальто~надевать шинель
mettre une vareuse|надевать китель
mettre des chaussures militaires|надевать военную обувь`,
    appearance: `une tenue propre|чистая форма|В исходнике опечатка: «чистая форму».
une tenue soignée|аккуратная форма
repasser sa tenue|гладить форму~гладить свою форму
être repassé~être repassée|быть выглаженным~быть выглаженной
être sans tache|быть без пятен
cirer ses chaussures|начищать обувь~начищать свою обувь
garder les mains dans les poches|держать руки в карманах
sortir d’un bâtiment sans coiffure|выходить из здания без головного убора
porter une moustache|носить усы
porter une barbe|носить бороду
respecter les règles de tenue|соблюдать правила ношения формы`,
    ranks: `un insigne de grade|знак различия воинского звания
un insigne de décoration|знак награды
le grade du militaire|воинское звание военнослужащего
des pattes d’épaule~des épaulettes|погоны|Надстрочные обозначения рода из PDF убраны; оба французских варианта принимаются.
une étoile sur la patte d’épaule|звезда на погоне
une patte de col|петлица
un écusson d’arme|эмблема рода войск
un insigne de corps|знак принадлежности к воинской части~знак принадлежности к корпусу
porter des insignes|носить знаки различия
vérifier des insignes|проверять знаки различия
reconnaître le grade d’un militaire|распознавать воинское звание военнослужащего
identifier le grade d’un militaire|определять воинское звание военнослужащего
appartenir à une unité|принадлежать к воинскому подразделению`,
    qualities: `respectueux~respectueuse|уважительный~уважительная
intelligent~intelligente|умный~умная
sympathique|приятный~приятная
aventurier~aventurière|авантюрист~авантюристка
généreux~généreuse|щедрый~щедрая
courageux~courageuse|смелый~смелая~храбрый~храбрая
obéissant~obéissante|покорный~покорная~послушный~послушная
volontaire|инициативный~инициативная
intéressant~intéressante|интересный~интересная
dynamique|энергичный~энергичная
drôle|смешной~смешная
indépendant~indépendante|независимый~независимая
égoïste|эгоистичный~эгоистичная~эгоист~эгоистка|В PDF русский перевод отсутствует; здесь он добавлен.
paresseux~paresseuse|ленивый~ленивая
désordonné~désordonnée|неорганизованный~неорганизованная
fier~fière|гордый~гордая
exigeant~exigeante|требовательный~требовательная
autoritaire|властный~властная
être fier de son engagement~être fière de son engagement|гордиться своей службой
être fier de participer à une mission~être fière de participer à une mission|гордиться участием в задании
être un exemple pour les autres|быть примером для других
être apprécié par ses collègues~être appréciée par ses collègues|нравиться своим коллегам
avoir de l’énergie et de la motivation|обладать энергией и мотивацией
aimer le travail bien fait|любить хорошо выполненную работу
aimer commander les autres|любить командовать другими
adorer être en mission|обожать находиться на задании
raconter ses expériences en opération|рассказывать о своём опыте во время операции
faire rire ses collègues|смешить своих коллег`,
    duties: `respecter le règlement|соблюдать устав
respecter les règles|соблюдать правила
respecter les règles de sécurité|соблюдать правила безопасности
exécuter les ordres|выполнять приказы
donner un ordre|отдавать приказ~отдать приказ
recevoir un ordre|получать приказ~получить приказ
respecter les coutumes de la guerre|соблюдать обычаи войны~уважать обычаи войны
respecter les conventions internationales|соблюдать международные конвенции
respecter les différences|уважать различия
respecter la neutralité des armées|соблюдать нейтралитет вооружённых сил~уважать нейтралитет вооружённых сил
respecter l’ennemi|уважать противника
protéger la population civile|защищать гражданское население
aider ses camarades|помогать своим товарищам~помогать товарищам
être solidaire avec ses camarades|проявлять солидарность с товарищами
être honnête, franc et loyal|быть честным, открытым и верным
être attentif aux autres~être attentive aux autres|быть внимательным к другим~быть внимательной к другим
être maître de sa force|владеть своей силой~контролировать применение своей силы
être au service de son pays|служить своей стране
se contrôler dans toutes les situations|контролировать себя в любых ситуациях
prendre une décision|принимать решение~принять решение
avoir des droits et des devoirs|иметь права и обязанности
développer des compétences|развивать навыки
développer ses capacités physiques|развивать свои физические способности
avoir une force morale|обладать моральной стойкостью
comprendre le monde et la société|понимать мир и общество
représenter son pays|представлять свою страну
représenter son régiment|представлять свой полк`,
    daily: `se lever tôt|вставать рано
se lever tard|вставать поздно
se coucher|ложиться спать
être en retard|опаздывать
être à l’heure|быть вовремя
arriver à la caserne|прибывать в казарму
retourner à la caserne|возвращаться в казарму
se préparer aux exercices|готовиться к учениям
préparer le matériel pour les exercices|готовить снаряжение для учений
faire de l’exercice|заниматься физическими упражнениями
faire du sport|заниматься спортом
participer aux exercices militaires|участвовать в военных учениях
partir en mission|отправляться на задание
être en opération|находиться в зоне операции~участвовать в операции
avant l’opération|до операции
pendant l’opération|во время операции
après l’opération|после операции
la veille des exercices|накануне учений
rassembler les soldats|собрать солдат~собирать солдат
se réunir devant le bâtiment|собраться перед зданием~собираться перед зданием
garder le silence|соблюдать тишину`,
    safety: `utiliser une arme|пользоваться оружием~использовать оружие
utiliser une arme seulement si c’est nécessaire|использовать оружие только при необходимости
prendre des risques|рисковать
prendre des risques inutiles|идти на неоправданный риск
ne pas prendre de risques inutiles|не рисковать без необходимости
transporter le matériel|перевозить снаряжение
réparer le matériel|ремонтировать снаряжение
nettoyer le matériel|чистить снаряжение`,
    missions: `réaliser une mission|выполнять задание
gagner et vaincre|побеждать
visiter les populations dans les villages|посещать население в деревнях
donner à manger aux personnes|давать людям еду~кормить людей
apporter de la nourriture|приносить еду
aider les habitants d’un village|помогать жителям деревни
parler de son expérience|рассказывать о своём опыте
être attentif aux besoins des autres~être attentive aux besoins des autres|быть внимательным к потребностям других~быть внимательной к потребностям других`,
    imperative: `Sois un exemple !|Будь примером!
Soyez courageux !|Будьте храбрыми!~Будьте смелыми!
Respecte le règlement !|Соблюдай устав!
Respectez les ordres !|Соблюдайте приказы!~Выполняйте приказы!|В PDF: «Выполняйте приказы!». Respecter — соблюдать; exécuter — выполнять.
Exécute les ordres !|Выполняй приказы!
Protégez la population !|Защищайте население!
Respecte les règles de sécurité !|Соблюдай правила безопасности!
Utilisez vos armes seulement si c’est nécessaire !|Используйте оружие только при необходимости!~Используйте своё оружие только при необходимости!
Fais de l’exercice tous les jours !|Занимайся физическими упражнениями каждый день!
Faites du sport !|Занимайтесь спортом!
Lève-toi tôt !|Вставай рано!
Levez-vous tôt !|Вставайте рано!
Prépare ton équipement !|Подготовь своё снаряжение!
Préparez-vous aux exercices !|Подготовьтесь к учениям!
Mets ta tenue militaire !|Надень военную форму!~Надень свою военную форму!
Mettez une tenue propre !|Наденьте чистую форму!
Cire tes chaussures !|Начисти обувь!~Начисти свою обувь!
Aide tes camarades !|Помогай своим товарищам!~Помогай товарищам!
Soyons solidaires !|Давайте проявлять солидарность!
Gardons le silence !|Давайте соблюдать тишину!`,
    negative: `Ne sois pas égoïste !|Не будь эгоистом!
Ne sois pas paresseux !|Не ленись!
Ne sois pas en retard !|Не опаздывай!
Ne te couche pas tard !|Не ложись поздно!
Ne vous couchez pas tard !|Не ложитесь поздно!
Ne garde pas les mains dans les poches !|Не держи руки в карманах!
Ne commande pas tout le monde !|Не командуй всеми!
Ne prenez pas de risques inutiles !|Не рискуйте без необходимости!
N’utilisez pas vos armes sans nécessité !|Не используйте оружие без необходимости!~Не используйте своё оружие без необходимости!
Ne violez pas les règles de sécurité !|Не нарушайте правила безопасности!
N’oublie pas tes documents !|Не забудь документы!~Не забудь свои документы!
Ne te prépare pas trop tard !|Не начинай готовиться слишком поздно!`,
    connectors: `la veille des exercices|накануне учений
tous les jours|каждый день
toujours et partout|всегда и везде
dans toutes les situations|во всех ситуациях
en fonction de la situation|в зависимости от ситуации
pour les autres soldats|для других солдат
au service de son pays|на службе своей страны
dans son unité|в своём подразделении
dans l’armée de terre|в сухопутных войсках
avec ses camarades|со своими товарищами
pour gagner et vaincre|чтобы победить
seulement si c’est nécessaire|только если это необходимо
sans nécessité|без необходимости
au XIXe siècle|в XIX веке~в 19 веке~в девятнадцатом веке
pendant la Seconde Guerre mondiale|во время Второй мировой войны`
  };
  const cards = sections.flatMap(topic => rows[topic.id].split('\n').map((line, index) => {
    const [fr, ru, note = ''] = line.split('|');
    return {id: `${topic.id}-${String(index + 1).padStart(2, '0')}`, topic: topic.id,
      fr: fr.split('~')[0], ru: ru.split('~')[0],
      frAlt: fr.split('~').slice(1), ruAlt: ru.split('~').slice(1), note,
      page: topic.id === 'duties' && index >= 25 ? 3 : topic.page};
  }));
  root.MILITAIRE_DATA = {version: 1, source: 'VOCABULAIRE MILITAIRE.pdf', sections, cards};
})(typeof window === 'undefined' ? globalThis : window);
